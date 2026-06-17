import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';
import { PostCategory } from '../entities/post-category.entity';
import { PostTag } from '../entities/post-tag.entity';
import { Repository } from 'typeorm';
import { PostStatus } from '../enums/blog.enums';
import { PublishPostDto } from './dto/publish-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import { AllPostsResponse } from './interfaces/interfaces';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostCategory)
    private readonly postCategoryRepository: Repository<PostCategory>,
    @InjectRepository(PostTag)
    private readonly postTagRepository: Repository<PostTag>,
  ) {}

  async create(createPostDto: CreatePostDto, authorId: number): Promise<Post> {
    const { category_ids, tag_ids, ...postData } = createPostDto;

    const existingPost = await this.postRepository.findOne({
      where: [{ title: postData.title }, { slug: postData.slug }],
    });

    if (existingPost && existingPost.author_id === authorId) {
      throw new ConflictException(
        'A post with the same title or slug already exists for this author',
      );
    }

    if (!postData.slug) {
      postData.slug = postData.title;
    }

    if (
      postData.status === PostStatus.PUBLISHED &&
      !(postData as Post).published_at
    ) {
      (postData as Post).published_at = new Date();
    }

    const post = this.postRepository.create({
      ...postData,
      author_id: authorId,
    });
    const saved = await this.postRepository.save(post);

    await this.syncCategories(saved.id, category_ids);
    await this.syncTags(saved.id, tag_ids);

    return this.findOneById(saved.id, false);
  }

  async findAllPosts(query: PostQueryDto): Promise<AllPostsResponse> {
    const {
      status,
      author_id,
      category_slug,
      tag_slug,
      search,
      page = 1,
      limit = 10,
      sort = 'latest',
    } = query;

    const qb = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.postCategories', 'pc')
      .leftJoinAndSelect('pc.category', 'category')
      .leftJoinAndSelect('post.postTags', 'pt')
      .leftJoinAndSelect('pt.tag', 'tag');

    if (status) {
      qb.andWhere('post.status = :status', { status });
    }

    if (author_id) {
      qb.andWhere('post.author_id = :author_id', { author_id });
    }

    if (category_slug) {
      qb.andWhere('category.slug = :category_slug', { category_slug });
    }

    if (tag_slug) {
      qb.andWhere('tag.slug = :tag_slug', { tag_slug });
    }

    if (search) {
      qb.andWhere(
        '(LOWER(post.title) LIKE LOWER(:search) OR LOWER(post.content) LIKE LOWER(:search))',
        {
          search: `%${search}%`,
        },
      );
    }

    if (sort === 'popular') {
      qb.orderBy('post.views_count', 'DESC');
    } else if (sort === 'oldest') {
      qb.orderBy('post.created_at', 'ASC');
    } else {
      qb.orderBy('post.created_at', 'DESC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((post) => this.flatten(post)),
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getRelatedPosts(postId: string): Promise<Post[]> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: [
        'postTags',
        'postTags.tag',
        'postCategories',
        'postCategories.category',
      ],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const tagIds = post.postTags.map((pt) => pt.tag.id);
    const categoryIds = post.postCategories.map((pc) => pc.category.id);

    const qb = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.postCategories', 'pc')
      .leftJoinAndSelect('pc.category', 'category')
      .leftJoinAndSelect('post.postTags', 'pt')
      .leftJoinAndSelect('pt.tag', 'tag')
      .where('post.id != :postId', { postId })
      .andWhere('post.status = :status', { status: 'PUBLISHED' });

    if (tagIds.length > 0) {
      qb.orWhere('tag.id IN (:...tagIds)', { tagIds });
    }

    if (categoryIds.length > 0) {
      qb.orWhere('category.id IN (:...categoryIds)', { categoryIds });
    }

    qb.orderBy('post.created_at', 'DESC').take(5);

    const related = await qb.getMany();
    return related.map((p) => this.flatten(p));
  }

  async findOne(idOrSlug: string): Promise<Post> {
    const uuidRegex =
      // This is a regular expression used to check if the input is a UUID.
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(idOrSlug);

    if (isUuid) {
      return this.findOneById(idOrSlug);
    } else {
      return this.findOneBySlug(idOrSlug);
    }
  }

  async findOneById(id: string, incrementViews = true): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: [
        'author',
        'postCategories',
        'postCategories.category',
        'postTags',
        'postTags.tag',
      ],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (incrementViews) {
      await this.incrementViews(post.id);
    }

    return this.flatten(post);
  }

  async findOneBySlug(slug: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { slug },
      relations: [
        'author',
        'postCategories',
        'postCategories.category',
        'postTags',
        'postTags.tag',
      ],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.incrementViews(post.id);

    return this.flatten(post);
  }

  async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const { category_ids, tag_ids, ...postData } = updatePostDto;

    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    Object.assign(post, postData);
    await this.postRepository.save(post);

    if (category_ids) {
      await this.syncCategories(id, category_ids);
    }
    if (tag_ids) {
      await this.syncTags(id, tag_ids);
    }

    return this.findOneById(id, false);
  }

  async publishPost(id: string, dto: PublishPostDto): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.status = dto.status;

    if (dto.status === PostStatus.PUBLISHED) {
      post.published_at = new Date();
      post.scheduled_at = null;
    }

    if (dto.status === PostStatus.SCHEDULED && dto.scheduled_at) {
      post.scheduled_at = new Date(dto.scheduled_at);
    }

    await this.postRepository.save(post);
    return this.findOneById(id, false);
  }

  async remove(id: string): Promise<void> {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    await this.postRepository.remove(post);
  }

  async incrementViews(postId: string): Promise<void> {
    await this.postRepository.increment({ id: postId }, 'views_count', 1);
  }

  /** Replace the post↔category links with the provided category UUIDs. */
  private async syncCategories(
    postId: string,
    categoryIds?: string[],
  ): Promise<void> {
    if (categoryIds === undefined) return;

    await this.postCategoryRepository.delete({ post_id: postId });

    const unique = [...new Set(categoryIds)];
    if (unique.length === 0) return;

    const rows = unique.map((category_id) =>
      this.postCategoryRepository.create({ post_id: postId, category_id }),
    );
    await this.postCategoryRepository.save(rows);
  }

  /** Replace the post↔tag links with the provided tag UUIDs. */
  private async syncTags(postId: string, tagIds?: string[]): Promise<void> {
    if (tagIds === undefined) return;

    await this.postTagRepository.delete({ post_id: postId });

    const unique = [...new Set(tagIds)];
    if (unique.length === 0) return;

    const rows = unique.map((tag_id) =>
      this.postTagRepository.create({ post_id: postId, tag_id }),
    );
    await this.postTagRepository.save(rows);
  }

  /**
   * Flatten the join-table relations into convenient `categories`/`tags`
   * arrays so the frontend doesn't have to dig through postCategories/postTags.
   */
  private flatten(post: Post): Post {
    const categories = (post.postCategories ?? [])
      .map((pc) => pc.category)
      .filter(Boolean);
    const tags = (post.postTags ?? []).map((pt) => pt.tag).filter(Boolean);

    return Object.assign(post, { categories, tags });
  }
}

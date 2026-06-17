import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../entities/post.entity';
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
  ) {}

  async create(createPostDto: CreatePostDto, authorId: number): Promise<Post> {
    const existingPost = await this.postRepository.findOne({
      where: [{ title: createPostDto.title }, { slug: createPostDto.slug }],
    });

    if (existingPost && existingPost.author_id === authorId) {
      throw new ConflictException(
        'A post with the same title or slug already exists for this author',
      );
    }
    const post = this.postRepository.create({
      ...createPostDto,
      author_id: authorId,
    });
    return this.postRepository.save(post);
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
      data,
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
      .leftJoin('post.postTags', 'pt')
      .leftJoin('pt.tag', 'tag')
      .leftJoin('post.postCategories', 'pc')
      .leftJoin('pc.category', 'category')
      .where('post.id != :postId', { postId })
      .andWhere('post.status = :status', { status: 'PUBLISHED' });

    if (tagIds.length > 0) {
      qb.orWhere('tag.id IN (:...tagIds)', { tagIds });
    }

    if (categoryIds.length > 0) {
      qb.orWhere('category.id IN (:...categoryIds)', { categoryIds });
    }

    qb.orderBy('post.created_at', 'DESC').take(5);

    return qb.getMany();
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

  async findOneById(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['postTags', 'postCategories'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.incrementViews(post.id);

    return post;
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

    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);

    Object.assign(post, updatePostDto);

    return this.postRepository.save(post);
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

    return this.postRepository.save(post);
  }

  async remove(id: string): Promise<void> {
    const post = await this.findOne(id);
    await this.postRepository.remove(post);
  }

  async incrementViews(postId: string): Promise<void> {
    await this.postRepository.increment({ id: postId }, 'views_count', 1);
  }
}

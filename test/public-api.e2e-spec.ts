/* eslint-disable */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PostViewDto } from '../src/modules/content-manage/posts/api/view-dto/post.view-dto';
import { BlogViewDto } from '../src/modules/content-manage/blogs/api/view-dto/blog.view-dto';
import { PaginatedViewDto } from '../src/core/dto/base.paginated.view-dto';
import { Server } from 'http';
import { E2ETestHelper } from './helpers/e2e-test-helper';
import { PostSortBy } from '../src/modules/content-manage/posts/api/input-dto/post-sort-by';

describe('Public API (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let createdBlogId: string | null = null;
  let createdPostId: string | null = null;
  let secondBlogId: string | null = null;
  let secondPostId: string | null = null;

  // Базовые учетные данные для создания тестовых данных
  const adminCredentials = Buffer.from('admin:qwerty').toString('base64');

  beforeAll(async () => {
    const testSetup = await E2ETestHelper.createTestingApp();
    app = testSetup.app;
    server = testSetup.server;

    // Создаем первый блог и пост для тестирования
    const firstBlogData = {
      name: 'First Blog',
      description: 'This is the first test blog for public API testing',
      websiteUrl: 'https://firstblog.com',
      createdAt: new Date(),
      isMembership: false,
    };

    const firstBlogResponse = await request(server)
      .post('/sa/blogs')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(firstBlogData)
      .expect(201);

    createdBlogId = firstBlogResponse.body.id;

    // Создаем пост для первого блога
    const firstPostData = {
      title: 'First Post Title',
      shortDescription: 'This is the first test post short description',
      content:
        'This is the content of the first test post with sufficient length to meet validation requirements',
    };

    const firstPostResponse = await request(server)
      .post(`/sa/blogs/${createdBlogId}/posts`)
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(firstPostData)
      .expect(201);

    createdPostId = firstPostResponse.body.id;

    // Создаем второй блог и пост для тестирования сортировки и пагинации
    const secondBlogData = {
      name: 'Second Blog',
      description: 'This is the second test blog for public API testing',
      websiteUrl: 'https://secondblog.com',
      createdAt: new Date(),
      isMembership: false,
    };

    const secondBlogResponse = await request(server)
      .post('/sa/blogs')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(secondBlogData)
      .expect(201);

    secondBlogId = secondBlogResponse.body.id;

    // Создаем пост для второго блога
    const secondPostData = {
      title: 'Second Post Title',
      shortDescription: 'This is the second test post short description',
      content:
        'This is the content of the second test post with sufficient length to meet validation requirements',
    };

    const secondPostResponse = await request(server)
      .post(`/sa/blogs/${secondBlogId}/posts`)
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(secondPostData)
      .expect(201);

    secondPostId = secondPostResponse.body.id;
  });

  afterAll(async () => {
    await E2ETestHelper.cleanup(app, server);
  });

  describe('Public Blogs API', () => {
    it('should get all blogs (GET /blogs)', async () => {
      const response = await request(server).get('/blogs').expect(200);

      const responseBody = response.body as PaginatedViewDto<BlogViewDto[]>;

      expect(responseBody).toHaveProperty('items');
      expect(responseBody).toHaveProperty('totalCount');
      expect(responseBody).toHaveProperty('page');
      expect(responseBody).toHaveProperty('pageSize');
      expect(Array.isArray(responseBody.items)).toBe(true);
      expect(responseBody.totalCount).toBeGreaterThanOrEqual(2);
      expect(responseBody.items.length).toBeGreaterThanOrEqual(2);
    });

    it('should get blog by ID (GET /blogs/:id)', async () => {
      if (!createdBlogId) {
        throw new Error('Blog ID is not set');
      }

      const response = await request(server)
        .get(`/blogs/${createdBlogId}`)
        .expect(200);

      const responseBody = response.body as BlogViewDto;

      expect(responseBody).toEqual({
        id: createdBlogId,
        name: 'First Blog',
        description: 'This is the first test blog for public API testing',
        websiteUrl: 'https://firstblog.com',
        createdAt: expect.any(String) as string,
        isMembership: expect.any(Boolean) as boolean,
      });
    });

    it('should return 404 for non-existent blog (GET /blogs/:id)', async () => {
      const fakeId = '65d8a6b1-d4f1-a04e-8a0e-000000000000';
      await request(server).get(`/blogs/${fakeId}`).expect(404);
    });

    it('should get posts for a blog (GET /blogs/:id/posts)', async () => {
      if (!createdBlogId) {
        throw new Error('Blog ID is not set');
      }

      const response = await request(server)
        .get(`/blogs/${createdBlogId}/posts`)
        .expect(200);

      const responseBody = response.body as PaginatedViewDto<PostViewDto[]>;

      expect(responseBody).toHaveProperty('items');
      expect(responseBody).toHaveProperty('totalCount');
      expect(responseBody).toHaveProperty('page');
      expect(responseBody).toHaveProperty('pageSize');
      expect(Array.isArray(responseBody.items)).toBe(true);
      expect(responseBody.totalCount).toBeGreaterThanOrEqual(1);

      // Проверяем, что пост принадлежит правильному блогу
      const post = responseBody.items.find((p) => p.id === createdPostId);
      expect(post).toBeDefined();
      expect(post?.blogId).toBe(createdBlogId);
    });

    it('should return 404 for posts of non-existent blog (GET /blogs/:id/posts)', async () => {
      const fakeId = '65d8a6b1-d4f1-a04e-8a0e-000000000000';
      await request(server).get(`/blogs/${fakeId}/posts`).expect(404);
    });
  });

  describe('Public Posts API', () => {
    it('should get all posts (GET /posts)', async () => {
      const response = await request(server).get('/posts').expect(200);

      const responseBody = response.body as PaginatedViewDto<PostViewDto[]>;

      expect(responseBody).toHaveProperty('items');
      expect(responseBody).toHaveProperty('totalCount');
      expect(responseBody).toHaveProperty('page');
      expect(responseBody).toHaveProperty('pageSize');
      expect(Array.isArray(responseBody.items)).toBe(true);
      expect(responseBody.totalCount).toBeGreaterThanOrEqual(2);
      expect(responseBody.items.length).toBeGreaterThanOrEqual(2);
    });

    it('should get post by ID (GET /posts/:id)', async () => {
      if (!createdPostId) {
        throw new Error('Post ID is not set');
      }

      const response = await request(server)
        .get(`/posts/${createdPostId}`)
        .expect(200);

      const responseBody = response.body as PostViewDto;

      expect(responseBody).toEqual({
        id: createdPostId,
        title: 'First Post Title',
        shortDescription: 'This is the first test post short description',
        content:
          'This is the content of the first test post with sufficient length to meet validation requirements',
        blogId: createdBlogId,
        blogName: 'First Blog',
        createdAt: expect.any(String) as string,
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
          newestLikes: [],
        },
      });
    });

    it('should return 404 for non-existent post (GET /posts/:id)', async () => {
      const fakeId = '65d8a6b1-d4f1-a04e-8a0e-000000000000';
      await request(server).get(`/posts/${fakeId}`).expect(404);
    });
  });

  describe('Pagination and Sorting Tests', () => {
    it('should support pagination for blogs (GET /blogs)', async () => {
      const response = await request(server)
        .get('/blogs')
        .query({
          pageNumber: 1,
          pageSize: 1,
        })
        .expect(200);

      const responseBody = response.body as PaginatedViewDto<BlogViewDto[]>;

      expect(responseBody.page).toBe(1);
      expect(responseBody.pageSize).toBe(1);
      expect(responseBody.items.length).toBeLessThanOrEqual(1);
      expect(responseBody.totalCount).toBeGreaterThanOrEqual(2);
    });

    it('should support pagination for posts (GET /posts)', async () => {
      const response = await request(server)
        .get('/posts')
        .query({
          pageNumber: 1,
          pageSize: 1,
        })
        .expect(200);

      const responseBody = response.body as PaginatedViewDto<PostViewDto[]>;

      expect(responseBody.page).toBe(1);
      expect(responseBody.pageSize).toBe(1);
      expect(responseBody.items.length).toBeLessThanOrEqual(1);
      expect(responseBody.totalCount).toBeGreaterThanOrEqual(2);
    });

    it('should support sorting for posts (GET /posts)', async () => {
      const response = await request(server)
        .get('/posts')
        .query({
          sortBy: PostSortBy.createdAt,
          sortDirection: 'desc',
        })
        .expect(200);

      const responseBody = response.body as PaginatedViewDto<PostViewDto[]>;

      expect(responseBody.items.length).toBeGreaterThanOrEqual(2);

      // Проверяем, что посты отсортированы по дате создания (новые первыми)
      if (responseBody.items.length >= 2) {
        const firstPost = new Date(responseBody.items[0].createdAt);
        const secondPost = new Date(responseBody.items[1].createdAt);
        expect(firstPost.getTime()).toBeGreaterThanOrEqual(
          secondPost.getTime(),
        );
      }
    });

    it('should support sorting for blog posts (GET /blogs/:id/posts)', async () => {
      if (!createdBlogId) {
        throw new Error('Blog ID is not set');
      }

      const response = await request(server)
        .get(`/blogs/${createdBlogId}/posts`)
        .query({
          sortBy: PostSortBy.title,
          sortDirection: 'asc',
        })
        .expect(200);

      const responseBody = response.body as PaginatedViewDto<PostViewDto[]>;

      expect(responseBody.items.length).toBeGreaterThanOrEqual(1);

      // Проверяем, что посты отсортированы по заголовку (алфавитный порядок)
      if (responseBody.items.length >= 2) {
        expect(
          responseBody.items[0].title.localeCompare(
            responseBody.items[1].title,
          ),
        ).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('Search Tests', () => {
    it('should support search by title for posts (GET /posts)', async () => {
      const response = await request(server)
        .get('/posts')
        .query({
          searchTitleTerm: 'First',
        })
        .expect(200);

      const responseBody = response.body as PaginatedViewDto<PostViewDto[]>;

      expect(responseBody.items.length).toBeGreaterThanOrEqual(1);

      // Проверяем, что все найденные посты содержат "First" в заголовке
      responseBody.items.forEach((post) => {
        expect(post.title.toLowerCase()).toContain('first');
      });
    });

    it('should support search by title for blog posts (GET /blogs/:id/posts)', async () => {
      if (!createdBlogId) {
        throw new Error('Blog ID is not set');
      }

      const response = await request(server)
        .get(`/blogs/${createdBlogId}/posts`)
        .query({
          searchTitleTerm: 'First',
        })
        .expect(200);

      const responseBody = response.body as PaginatedViewDto<PostViewDto[]>;

      expect(responseBody.items.length).toBeGreaterThanOrEqual(1);

      // Проверяем, что все найденные посты содержат "First" в заголовке
      responseBody.items.forEach((post) => {
        expect(post.title.toLowerCase()).toContain('first');
      });
    });
  });

  describe('Optional JWT Authentication Tests', () => {
    it('should work without JWT token for posts (GET /posts)', async () => {
      const response = await request(server).get('/posts').expect(200);

      const responseBody = response.body as PaginatedViewDto<PostViewDto[]>;
      expect(responseBody.items.length).toBeGreaterThanOrEqual(2);

      // Проверяем, что myStatus = 'None' для неавторизованного пользователя
      responseBody.items.forEach((post) => {
        expect(post.extendedLikesInfo.myStatus).toBe('None');
      });
    });

    it('should work without JWT token for blog posts (GET /blogs/:id/posts)', async () => {
      if (!createdBlogId) {
        throw new Error('Blog ID is not set');
      }

      const response = await request(server)
        .get(`/blogs/${createdBlogId}/posts`)
        .expect(200);

      const responseBody = response.body as PaginatedViewDto<PostViewDto[]>;
      expect(responseBody.items.length).toBeGreaterThanOrEqual(1);

      // Проверяем, что myStatus = 'None' для неавторизованного пользователя
      responseBody.items.forEach((post) => {
        expect(post.extendedLikesInfo.myStatus).toBe('None');
      });
    });

    it('should work without JWT token for single post (GET /posts/:id)', async () => {
      if (!createdPostId) {
        throw new Error('Post ID is not set');
      }

      const response = await request(server)
        .get(`/posts/${createdPostId}`)
        .expect(200);

      const responseBody = response.body as PostViewDto;
      expect(responseBody.id).toBe(createdPostId);
      expect(responseBody.extendedLikesInfo.myStatus).toBe('None');
    });
  });
});

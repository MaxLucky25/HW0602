/* eslint-disable */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { CreateBlogInputDto } from '../src/modules/content-manage/blogs/api/input-dto/create-blog.input.dto';
import { BlogViewDto } from '../src/modules/content-manage/blogs/api/view-dto/blog.view-dto';
import { UpdateBlogInputDto } from '../src/modules/content-manage/blogs/api/input-dto/update-blog.input.dto';
import { PostViewDto } from '../src/modules/content-manage/posts/api/view-dto/post.view-dto';
import { Server } from 'http';
import { E2ETestHelper } from './helpers/e2e-test-helper';

describe('BlogController Admin Flow (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let createdBlogId: string | null = null;
  let secondBlogId: string | null = null;
  let createdPostId: string | null = null;

  // Базовые учетные данные для тестов
  const adminCredentials = Buffer.from('admin:qwerty').toString('base64');

  beforeAll(async () => {
    const testSetup = await E2ETestHelper.createTestingApp();
    app = testSetup.app;
    server = testSetup.server;

    // Создаем второй блог для тестирования новых эндпоинтов
    const secondBlogData = {
      name: 'Second Blog',
      description:
        'This is a second test blog for testing blog-specific endpoints',
      websiteUrl: 'https://secondtestblog.com',
      createdAt: new Date(),
      isMembership: false,
    };

    const secondBlogResponse = await request(server)
      .post('/sa/blogs')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(secondBlogData)
      .expect(201);

    secondBlogId = secondBlogResponse.body.id;
  });

  afterAll(async () => {
    await E2ETestHelper.cleanup(app, server);
  });

  it('should create a blog (POST)', async () => {
    const blogData: CreateBlogInputDto = {
      name: 'Test Blog',
      description: 'This is a test blog',
      websiteUrl: 'https://testblog.com',
      createdAt: new Date(),
      isMembership: false,
    };

    const response = await request(server)
      .post('/sa/blogs')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(blogData)
      .expect(201);

    const responseBody = response.body as BlogViewDto;

    expect(responseBody).toEqual({
      id: expect.any(String) as string,
      name: blogData.name,
      description: blogData.description,
      websiteUrl: blogData.websiteUrl,
      createdAt: expect.any(String) as string,
      isMembership: expect.any(Boolean) as boolean,
    });

    createdBlogId = responseBody.id;
  });

  it('should get blog by ID (GET)', async () => {
    if (!createdBlogId) {
      throw new Error('Blog ID is not set');
    }

    const response = await request(server)
      .get(`/sa/blogs/${createdBlogId}`)
      .set('Authorization', `Basic ${adminCredentials}`)
      .expect(200);

    const responseBody = response.body as BlogViewDto;
    expect(responseBody.id).toBe(createdBlogId);
  });

  it('should update blog (PUT)', async () => {
    if (!createdBlogId) {
      throw new Error('Blog ID is not set');
    }

    const updatedData: UpdateBlogInputDto = {
      name: 'Updated Blog',
      description: 'Updated description',
      websiteUrl: 'https://updatedblog.com',
    };

    await request(server)
      .put(`/sa/blogs/${createdBlogId}`)
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(updatedData)
      .expect(204);

    // Проверяем, что данные обновились
    const response = await request(server)
      .get(`/sa/blogs/${createdBlogId}`)
      .set('Authorization', `Basic ${adminCredentials}`)
      .expect(200);

    const responseBody = response.body as BlogViewDto;
    expect(responseBody.name).toBe(updatedData.name);
  });

  it('should delete blog (DELETE)', async () => {
    if (!createdBlogId) {
      throw new Error('Blog ID is not set');
    }

    await request(server)
      .delete(`/sa/blogs/${createdBlogId}`)
      .set('Authorization', `Basic ${adminCredentials}`)
      .expect(204);

    // Проверяем, что блог удалён
    await request(server)
      .get(`/sa/blogs/${createdBlogId}`)
      .set('Authorization', `Basic ${adminCredentials}`)
      .expect(404);
  });

  // Объединенный тест для валидации
  it('should return 400 for invalid blog data (POST)', async () => {
    const testCases = [
      {
        data: {
          name: '',
          description: 'Test21',
          websiteUrl: 'https://valid.com',
        },
        description: 'empty name',
      },
      {
        data: {
          name: 'A'.repeat(16), // Превышает максимальную длину 15 символов
          description: 'Valid',
          websiteUrl: 'https://valid.com',
        },
        description: 'name too long',
      },
      {
        data: {
          name: 'Test Blog',
          description: 'Test',
          websiteUrl: 'invalid-url',
        },
        description: 'invalid websiteUrl',
      },
    ];

    for (const testCase of testCases) {
      await request(server)
        .post('/sa/blogs')
        .set('Authorization', `Basic ${adminCredentials}`)
        .send(testCase.data)
        .expect(400);
    }
  });

  it('should return 404 if blog does not exist (GET)', async () => {
    const fakeId = '65d8a6b1-d4f1-a04e-8a0e-000000000000'; // Валидный UUID формат
    await request(server)
      .get(`/sa/blogs/${fakeId}`)
      .set('Authorization', `Basic ${adminCredentials}`)
      .expect(404);
  });

  it('should handle max length fields (POST)', async () => {
    const longName = 'A'.repeat(15); // Максимальная длина 15 символов
    const longDescription = 'B'.repeat(100); // Лимит 500 символов

    const response = await request(server)
      .post('/sa/blogs')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send({
        name: longName,
        description: longDescription,
        websiteUrl: 'https://valid.com',
      })
      .expect(201);

    const responseBody = response.body as BlogViewDto;
    expect(responseBody.name).toBe(longName);
  });

  // ===== НОВЫЕ ТЕСТЫ ДЛЯ ЭНДПОИНТОВ ПОСТОВ ЧЕРЕЗ БЛОГИ =====

  describe('Blog Posts Management', () => {
    it('should create a post for a blog (POST /sa/blogs/:blogId/posts)', async () => {
      if (!secondBlogId) {
        throw new Error('Second Blog ID is not set');
      }

      const postData = {
        title: 'Test Post for Blog',
        shortDescription: 'This is a test post created for a specific blog',
        content:
          'This is the content of a test post created for a specific blog with sufficient length',
      };

      const response = await request(server)
        .post(`/sa/blogs/${secondBlogId}/posts`)
        .set('Authorization', `Basic ${adminCredentials}`)
        .send(postData)
        .expect(201);

      const responseBody = response.body as PostViewDto;

      expect(responseBody).toEqual({
        id: expect.any(String) as string,
        title: postData.title,
        shortDescription: postData.shortDescription,
        content: postData.content,
        blogId: secondBlogId, // blogId берется из URL
        blogName: expect.any(String) as string,
        createdAt: expect.any(String) as string,
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
          newestLikes: [],
        },
      });

      createdPostId = responseBody.id;
    });

    it('should get all posts for a blog (GET /sa/blogs/:blogId/posts)', async () => {
      if (!secondBlogId) {
        throw new Error('Second Blog ID is not set');
      }

      const response = await request(server)
        .get(`/sa/blogs/${secondBlogId}/posts`)
        .query({
          pageNumber: 1,
          pageSize: 10,
          sortBy: 'createdAt',
          sortDirection: 'desc',
        })
        .set('Authorization', `Basic ${adminCredentials}`)
        .expect(200);

      const responseBody = response.body;
      expect(responseBody).toHaveProperty('items');
      expect(responseBody).toHaveProperty('totalCount');
      expect(responseBody).toHaveProperty('page');
      expect(responseBody).toHaveProperty('pageSize');
      expect(Array.isArray(responseBody.items)).toBe(true);
      expect(responseBody.totalCount).toBeGreaterThan(0);
    });

    it('should update a post for a blog (PUT /sa/blogs/:blogId/posts/:postId)', async () => {
      if (!secondBlogId || !createdPostId) {
        throw new Error('Second Blog ID or Post ID is not set');
      }

      const updatedData = {
        title: 'Updated Post Title',
        shortDescription: 'Updated short description',
        content:
          'Updated post content with sufficient length to meet validation requirements',
      };

      await request(server)
        .put(`/sa/blogs/${secondBlogId}/posts/${createdPostId}`)
        .set('Authorization', `Basic ${adminCredentials}`)
        .send(updatedData)
        .expect(204);

      // Проверяем, что данные обновились через админский эндпоинт
      const response = await request(server)
        .get(`/sa/blogs/${secondBlogId}/posts`)
        .set('Authorization', `Basic ${adminCredentials}`)
        .expect(200);

      const responseBody = response.body;
      const updatedPost = responseBody.items.find(
        (post: PostViewDto) => post.id === createdPostId,
      );
      expect(updatedPost).toBeDefined();
      expect(updatedPost.title).toBe(updatedData.title);
      expect(updatedPost.shortDescription).toBe(updatedData.shortDescription);
      expect(updatedPost.content).toBe(updatedData.content);
    });

    it('should delete a post for a blog (DELETE /sa/blogs/:blogId/posts/:postId)', async () => {
      if (!secondBlogId || !createdPostId) {
        throw new Error('Second Blog ID or Post ID is not set');
      }

      await request(server)
        .delete(`/sa/blogs/${secondBlogId}/posts/${createdPostId}`)
        .set('Authorization', `Basic ${adminCredentials}`)
        .expect(204);

      // Проверяем, что пост удалён через админский эндпоинт
      const response = await request(server)
        .get(`/sa/blogs/${secondBlogId}/posts`)
        .set('Authorization', `Basic ${adminCredentials}`)
        .expect(200);

      const responseBody = response.body;
      const deletedPost = responseBody.items.find(
        (post: PostViewDto) => post.id === createdPostId,
      );
      expect(deletedPost).toBeUndefined();
    });

    it('should return 404 when trying to update post from wrong blog', async () => {
      if (!secondBlogId) {
        throw new Error('Second Blog ID is not set');
      }

      // Создаем пост во втором блоге
      const postData = {
        title: 'Post for Wrong Blog Test',
        shortDescription: 'This post will be used for wrong blog test',
        content: 'This is the content for testing wrong blog scenario',
      };

      const postResponse = await request(server)
        .post(`/sa/blogs/${secondBlogId}/posts`)
        .set('Authorization', `Basic ${adminCredentials}`)
        .send(postData)
        .expect(201);

      const postId = postResponse.body.id;

      // Пытаемся обновить пост через несуществующий блог (неправильный блог)
      const fakeBlogId = '65d8a6b1-d4f1-a04e-8a0e-000000000000';
      const updatedData = {
        title: 'Updated Title',
        shortDescription: 'Updated description',
        content: 'Updated content',
      };

      await request(server)
        .put(`/sa/blogs/${fakeBlogId}/posts/${postId}`)
        .set('Authorization', `Basic ${adminCredentials}`)
        .send(updatedData)
        .expect(404);
    });

    it('should return 404 when trying to delete post from wrong blog', async () => {
      if (!secondBlogId) {
        throw new Error('Second Blog ID is not set');
      }

      // Создаем пост во втором блоге
      const postData = {
        title: 'Post for Wrong Blog Delete',
        shortDescription: 'This post will be used for wrong blog delete test',
        content: 'This is the content for testing wrong blog delete scenario',
      };

      const postResponse = await request(server)
        .post(`/sa/blogs/${secondBlogId}/posts`)
        .set('Authorization', `Basic ${adminCredentials}`)
        .send(postData)
        .expect(201);

      const postId = postResponse.body.id;

      // Пытаемся удалить пост через несуществующий блог (неправильный блог)
      const fakeBlogId = '65d8a6b1-d4f1-a04e-8a0e-000000000000';
      await request(server)
        .delete(`/sa/blogs/${fakeBlogId}/posts/${postId}`)
        .set('Authorization', `Basic ${adminCredentials}`)
        .expect(404);
    });
  });
});

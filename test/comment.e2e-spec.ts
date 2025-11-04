/* eslint-disable */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { E2ETestHelper } from './helpers/e2e-test-helper';
import { CreateCommentInputDto } from '../src/modules/content-manage/comments/api/input-dto/create-comment.input.dto';
import { UpdateCommentInputDto } from '../src/modules/content-manage/comments/api/input-dto/update-comment.input.dto';
import { CreatePostInputDto } from '../src/modules/content-manage/posts/api/input-dto/create-post.input.dto';

describe('Comments (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let createdPostId: string | null = null;
  let createdBlogId: string | null = null;
  let createdCommentId: string | null = null;
  let userToken: string | null = null;
  let userId: string | null = null;

  // Базовые учетные данные для тестов
  const adminCredentials = Buffer.from('admin:qwerty').toString('base64');

  beforeAll(async () => {
    const testSetup = await E2ETestHelper.createTestingApp();
    app = testSetup.app;
    server = testSetup.server;

    // Создаем блог для тестирования
    const blogData = {
      name: 'TestBlog',
      description: 'This is a test blog for testing comments functionality',
      websiteUrl: 'https://testblogforcomments.com',
      createdAt: new Date(),
      isMembership: false,
    };

    const blogResponse = await request(server)
      .post('/sa/blogs')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(blogData)
      .expect(201);

    createdBlogId = blogResponse.body.id;

    // Создаем пост для тестирования комментариев
    const postData: CreatePostInputDto = {
      title: 'Test Post',
      shortDescription: 'Test post for comments functionality',
      content:
        'This is a test post content with sufficient length to meet validation requirements for testing comments functionality',
      blogId: createdBlogId!,
    };

    const postResponse = await request(server)
      .post(`/sa/blogs/${createdBlogId}/posts`)
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(postData)
      .expect(201);

    createdPostId = postResponse.body.id;

    // Создаем пользователя через админский эндпоинт
    const userData = {
      login: 'testuser',
      password: 'password123',
      email: 'test@example.com',
    };

    const userResponse = await request(server)
      .post('/sa/users')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(userData)
      .expect(201);

    userId = userResponse.body.id;

    // Логинимся пользователем
    const loginData = {
      loginOrEmail: 'testuser',
      password: 'password123',
    };

    const loginResponse = await request(server)
      .post('/auth/login')
      .send(loginData)
      .expect(200);

    userToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await E2ETestHelper.cleanup(app, server);
  });

  it('should create a comment (POST /posts/:postId/comments)', async () => {
    const commentData: CreateCommentInputDto = {
      content:
        'This is a test comment with sufficient length to meet validation requirements',
    };

    await request(server)
      .post(`/posts/${createdPostId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(commentData)
      .expect(201);

    // Получаем созданный комментарий через список комментариев
    const commentsResponse = await request(server)
      .get(`/posts/${createdPostId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(commentsResponse.body.items).toHaveLength(1);
    const comment = commentsResponse.body.items[0];

    expect(comment).toHaveProperty('id');
    expect(comment).toHaveProperty('content', commentData.content);
    expect(comment).toHaveProperty('commentatorInfo');
    expect(comment).toHaveProperty('createdAt');
    expect(comment).toHaveProperty('likesInfo');
    expect(comment.commentatorInfo).toHaveProperty('userId', userId);
    expect(comment.commentatorInfo).toHaveProperty('userLogin', 'testuser');
    expect(comment.likesInfo).toHaveProperty('likesCount', 0);
    expect(comment.likesInfo).toHaveProperty('dislikesCount', 0);
    expect(comment.likesInfo).toHaveProperty('myStatus', 'None');

    createdCommentId = comment.id;
  });

  it('should get comment by id (GET /comments/:id)', async () => {
    const response = await request(server)
      .get(`/comments/${createdCommentId}`)
      .expect(200);

    expect(response.body).toHaveProperty('id', createdCommentId);
    expect(response.body).toHaveProperty('content');
    expect(response.body).toHaveProperty('commentatorInfo');
    expect(response.body).toHaveProperty('createdAt');
    expect(response.body).toHaveProperty('likesInfo');
  });

  it('should get comment by id with user context (GET /comments/:id)', async () => {
    const response = await request(server)
      .get(`/comments/${createdCommentId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('id', createdCommentId);
    expect(response.body).toHaveProperty('content');
    expect(response.body).toHaveProperty('commentatorInfo');
    expect(response.body).toHaveProperty('createdAt');
    expect(response.body).toHaveProperty('likesInfo');
    expect(response.body.likesInfo).toHaveProperty('myStatus', 'None');
  });

  it('should get comments for post (GET /posts/:postId/comments)', async () => {
    const response = await request(server)
      .get(`/posts/${createdPostId}/comments`)
      .expect(200);

    expect(response.body).toHaveProperty('pagesCount');
    expect(response.body).toHaveProperty('page', 1);
    expect(response.body).toHaveProperty('pageSize', 10);
    expect(response.body).toHaveProperty('totalCount', 1);
    expect(response.body).toHaveProperty('items');
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toHaveProperty('id', createdCommentId);
  });

  it('should get comments for post with user context (GET /posts/:postId/comments)', async () => {
    const response = await request(server)
      .get(`/posts/${createdPostId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('pagesCount');
    expect(response.body).toHaveProperty('page', 1);
    expect(response.body).toHaveProperty('pageSize', 10);
    expect(response.body).toHaveProperty('totalCount', 1);
    expect(response.body).toHaveProperty('items');
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toHaveProperty('id', createdCommentId);
    expect(response.body.items[0].likesInfo).toHaveProperty('myStatus', 'None');
  });

  it('should update comment (PUT /comments/:id)', async () => {
    const updateData: UpdateCommentInputDto = {
      content:
        'This is an updated test comment with sufficient length to meet validation requirements',
    };

    await request(server)
      .put(`/comments/${createdCommentId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(updateData)
      .expect(204);

    // Проверяем, что комментарий обновился
    const response = await request(server)
      .get(`/comments/${createdCommentId}`)
      .expect(200);

    expect(response.body).toHaveProperty('content', updateData.content);
  });

  it('should not update comment by another user (PUT /comments/:id)', async () => {
    // Создаем второго пользователя через админский эндпоинт
    const user2Data = {
      login: 'testuser2',
      password: 'password123',
      email: 'test2@example.com',
    };

    await request(server)
      .post('/sa/users')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(user2Data)
      .expect(201);

    const login2Data = {
      loginOrEmail: 'testuser2',
      password: 'password123',
    };

    const login2Response = await request(server)
      .post('/auth/login')
      .send(login2Data)
      .expect(200);

    const user2Token = login2Response.body.accessToken;

    const updateData: UpdateCommentInputDto = {
      content:
        'This is an unauthorized update attempt with sufficient length to meet validation requirements',
    };

    await request(server)
      .put(`/comments/${createdCommentId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send(updateData)
      .expect(403);
  });

  it('should delete comment (DELETE /comments/:id)', async () => {
    await request(server)
      .delete(`/comments/${createdCommentId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(204);

    // Проверяем, что комментарий удален (soft delete)
    await request(server).get(`/comments/${createdCommentId}`).expect(404);
  });

  it('should not delete comment by another user (DELETE /comments/:id)', async () => {
    // Создаем новый комментарий
    const commentData: CreateCommentInputDto = {
      content:
        'This is a test comment for deletion test with sufficient length to meet validation requirements',
    };

    await request(server)
      .post(`/posts/${createdPostId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(commentData)
      .expect(201);

    // Получаем созданный комментарий через список комментариев
    const commentsResponse = await request(server)
      .get(`/posts/${createdPostId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    const newCommentId =
      commentsResponse.body.items[commentsResponse.body.items.length - 1].id;

    // Создаем второго пользователя через админский эндпоинт
    const user2Data = {
      login: 'testuser3',
      password: 'password123',
      email: 'test3@example.com',
    };

    await request(server)
      .post('/sa/users')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(user2Data)
      .expect(201);

    const login2Data = {
      loginOrEmail: 'testuser3',
      password: 'password123',
    };

    const login2Response = await request(server)
      .post('/auth/login')
      .send(login2Data)
      .expect(200);

    const user2Token = login2Response.body.accessToken;

    // Пытаемся удалить комментарий другим пользователем
    await request(server)
      .delete(`/comments/${newCommentId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .expect(403);

    // Удаляем комментарий правильным пользователем
    await request(server)
      .delete(`/comments/${newCommentId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(204);
  });

  it('should return 404 for non-existent comment (GET /comments/:id)', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    await request(server).get(`/comments/${nonExistentId}`).expect(404);
  });

  it('should return 404 for non-existent post when getting comments (GET /posts/:postId/comments)', async () => {
    const nonExistentPostId = '00000000-0000-0000-0000-000000000000';
    await request(server)
      .get(`/posts/${nonExistentPostId}/comments`)
      .expect(404);
  });

  it('should return 400 for invalid comment content (POST /posts/:postId/comments)', async () => {
    const invalidCommentData = {
      content: 'Too short', // Меньше 20 символов
    };

    await request(server)
      .post(`/posts/${createdPostId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send(invalidCommentData)
      .expect(400);
  });

  it('should return 401 for unauthorized comment creation (POST /posts/:postId/comments)', async () => {
    const commentData: CreateCommentInputDto = {
      content:
        'This is an unauthorized comment with sufficient length to meet validation requirements',
    };

    await request(server)
      .post(`/posts/${createdPostId}/comments`)
      .send(commentData)
      .expect(401);
  });
});

/* eslint-disable */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { E2ETestHelper } from './helpers/e2e-test-helper';
import { LikeCommentInputDto } from '../src/modules/content-manage/comments/api/input-dto/like-comment.input.dto';
import { CreateCommentInputDto } from '../src/modules/content-manage/comments/api/input-dto/create-comment.input.dto';
import { CreatePostInputDto } from '../src/modules/content-manage/posts/api/input-dto/create-post.input.dto';
import { LikeStatus } from '../src/modules/content-manage/comments/api/input-dto/comment-like.domain.dto';

describe('Comment Likes (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let createdPostId: string | null = null;
  let createdBlogId: string | null = null;
  let createdCommentId: string | null = null;
  let userTokens: string[] = [];
  let userIds: string[] = [];

  // Базовые учетные данные для тестов
  const adminCredentials = Buffer.from('admin:qwerty').toString('base64');

  beforeAll(async () => {
    const testSetup = await E2ETestHelper.createTestingApp();
    app = testSetup.app;
    server = testSetup.server;

    // Создаем блог для тестирования
    const blogData = {
      name: 'TestBlogLikes',
      description:
        'This is a test blog for testing comment likes functionality',
      websiteUrl: 'https://testblogforcommentlikes.com',
      createdAt: new Date(),
      isMembership: false,
    };

    const blogResponse = await request(server)
      .post('/sa/blogs')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(blogData)
      .expect(201);

    createdBlogId = blogResponse.body.id;

    // Создаем пост для тестирования
    const postData: CreatePostInputDto = {
      title: 'Test Post Likes',
      shortDescription: 'Test post for comment likes functionality',
      content:
        'This is a test post content with sufficient length to meet validation requirements for testing comment likes functionality',
      blogId: createdBlogId!,
    };

    const postResponse = await request(server)
      .post(`/sa/blogs/${createdBlogId}/posts`)
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(postData)
      .expect(201);

    createdPostId = postResponse.body.id;

    // Создаем комментарий для тестирования лайков
    const commentData: CreateCommentInputDto = {
      content:
        'This is a test comment for testing likes functionality with sufficient length to meet validation requirements',
    };

    // Создаем 4 пользователей для тестирования лайков через админский эндпоинт
    for (let i = 1; i <= 4; i++) {
      const userData = {
        login: `testuser${i}`,
        password: 'password123',
        email: `test${i}@example.com`,
      };

      const userResponse = await request(server)
        .post('/sa/users')
        .set('Authorization', `Basic ${adminCredentials}`)
        .send(userData)
        .expect(201);

      userIds.push(userResponse.body.id);

      const loginData = {
        loginOrEmail: `testuser${i}`,
        password: 'password123',
      };

      const loginResponse = await request(server)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      userTokens.push(loginResponse.body.accessToken);
    }

    // Создаем комментарий от первого пользователя
    await request(server)
      .post(`/posts/${createdPostId}/comments`)
      .set('Authorization', `Bearer ${userTokens[0]}`)
      .send(commentData)
      .expect(201);

    // Получаем созданный комментарий через список комментариев
    const commentsResponse = await request(server)
      .get(`/posts/${createdPostId}/comments`)
      .set('Authorization', `Bearer ${userTokens[0]}`)
      .expect(200);

    expect(commentsResponse.body.items).toHaveLength(1);
    createdCommentId = commentsResponse.body.items[0].id;
  }, 30000);

  afterAll(async () => {
    await E2ETestHelper.cleanup(app, server);
  }, 10000);

  it('should like a comment (PUT /comments/:commentId/like-status)', async () => {
    const likeData: LikeCommentInputDto = {
      likeStatus: LikeStatus.Like,
    };

    await request(server)
      .put(`/comments/${createdCommentId}/like-status`)
      .set('Authorization', `Bearer ${userTokens[0]}`)
      .send(likeData)
      .expect(204);

    // Проверяем, что лайк добавился
    const response = await request(server)
      .get(`/comments/${createdCommentId}`)
      .set('Authorization', `Bearer ${userTokens[0]}`)
      .expect(200);

    expect(response.body.likesInfo).toHaveProperty('likesCount', 1);
    expect(response.body.likesInfo).toHaveProperty('dislikesCount', 0);
    expect(response.body.likesInfo).toHaveProperty('myStatus', 'Like');
  });

  it('should dislike a comment (PUT /comments/:commentId/like-status)', async () => {
    const dislikeData: LikeCommentInputDto = {
      likeStatus: LikeStatus.Dislike,
    };

    await request(server)
      .put(`/comments/${createdCommentId}/like-status`)
      .set('Authorization', `Bearer ${userTokens[1]}`)
      .send(dislikeData)
      .expect(204);

    // Проверяем, что дизлайк добавился
    const response = await request(server)
      .get(`/comments/${createdCommentId}`)
      .set('Authorization', `Bearer ${userTokens[1]}`)
      .expect(200);

    expect(response.body.likesInfo).toHaveProperty('likesCount', 1);
    expect(response.body.likesInfo).toHaveProperty('dislikesCount', 1);
    expect(response.body.likesInfo).toHaveProperty('myStatus', 'Dislike');
  });

  it('should change like to dislike (PUT /comments/:commentId/like-status)', async () => {
    const dislikeData: LikeCommentInputDto = {
      likeStatus: LikeStatus.Dislike,
    };

    await request(server)
      .put(`/comments/${createdCommentId}/like-status`)
      .set('Authorization', `Bearer ${userTokens[0]}`)
      .send(dislikeData)
      .expect(204);

    // Проверяем, что лайк изменился на дизлайк
    const response = await request(server)
      .get(`/comments/${createdCommentId}`)
      .set('Authorization', `Bearer ${userTokens[0]}`)
      .expect(200);

    expect(response.body.likesInfo).toHaveProperty('likesCount', 0);
    expect(response.body.likesInfo).toHaveProperty('dislikesCount', 2);
    expect(response.body.likesInfo).toHaveProperty('myStatus', 'Dislike');
  });

  it('should remove like/dislike (PUT /comments/:commentId/like-status)', async () => {
    const noneData: LikeCommentInputDto = {
      likeStatus: LikeStatus.None,
    };

    await request(server)
      .put(`/comments/${createdCommentId}/like-status`)
      .set('Authorization', `Bearer ${userTokens[0]}`)
      .send(noneData)
      .expect(204);

    // Проверяем, что лайк/дизлайк удалился
    const response = await request(server)
      .get(`/comments/${createdCommentId}`)
      .set('Authorization', `Bearer ${userTokens[0]}`)
      .expect(200);

    expect(response.body.likesInfo).toHaveProperty('likesCount', 0);
    expect(response.body.likesInfo).toHaveProperty('dislikesCount', 1);
    expect(response.body.likesInfo).toHaveProperty('myStatus', 'None');
  });

  it('should add multiple likes and dislikes', async () => {
    // Пользователь 2 ставит лайк
    const likeData: LikeCommentInputDto = {
      likeStatus: LikeStatus.Like,
    };

    await request(server)
      .put(`/comments/${createdCommentId}/like-status`)
      .set('Authorization', `Bearer ${userTokens[1]}`)
      .send(likeData)
      .expect(204);

    // Пользователь 3 ставит лайк
    await request(server)
      .put(`/comments/${createdCommentId}/like-status`)
      .set('Authorization', `Bearer ${userTokens[2]}`)
      .send(likeData)
      .expect(204);

    // Пользователь 4 ставит дизлайк
    const dislikeData: LikeCommentInputDto = {
      likeStatus: LikeStatus.Dislike,
    };

    await request(server)
      .put(`/comments/${createdCommentId}/like-status`)
      .set('Authorization', `Bearer ${userTokens[3]}`)
      .send(dislikeData)
      .expect(204);

    // Проверяем итоговые счетчики
    const response = await request(server)
      .get(`/comments/${createdCommentId}`)
      .set('Authorization', `Bearer ${userTokens[0]}`)
      .expect(200);

    expect(response.body.likesInfo).toHaveProperty('likesCount', 2);
    expect(response.body.likesInfo).toHaveProperty('dislikesCount', 1);
    expect(response.body.likesInfo).toHaveProperty('myStatus', 'None');
  });

  it('should show correct myStatus for different users', async () => {
    // Пользователь 1 (без лайка)
    const response1 = await request(server)
      .get(`/comments/${createdCommentId}`)
      .set('Authorization', `Bearer ${userTokens[0]}`)
      .expect(200);

    expect(response1.body.likesInfo).toHaveProperty('myStatus', 'None');

    // Пользователь 2 (с лайком)
    const response2 = await request(server)
      .get(`/comments/${createdCommentId}`)
      .set('Authorization', `Bearer ${userTokens[1]}`)
      .expect(200);

    expect(response2.body.likesInfo).toHaveProperty('myStatus', 'Like');

    // Пользователь 4 (с дизлайком)
    const response4 = await request(server)
      .get(`/comments/${createdCommentId}`)
      .set('Authorization', `Bearer ${userTokens[3]}`)
      .expect(200);

    expect(response4.body.likesInfo).toHaveProperty('myStatus', 'Dislike');
  });

  it('should return 401 for unauthorized like (PUT /comments/:commentId/like-status)', async () => {
    const likeData: LikeCommentInputDto = {
      likeStatus: LikeStatus.Like,
    };

    await request(server)
      .put(`/comments/${createdCommentId}/like-status`)
      .send(likeData)
      .expect(401);
  });

  it('should return 404 for non-existent comment (PUT /comments/:commentId/like-status)', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const likeData: LikeCommentInputDto = {
      likeStatus: LikeStatus.Like,
    };

    await request(server)
      .put(`/comments/${nonExistentId}/like-status`)
      .set('Authorization', `Bearer ${userTokens[0]}`)
      .send(likeData)
      .expect(404);
  });

  it('should return 400 for invalid like status (PUT /comments/:commentId/like-status)', async () => {
    const invalidData = {
      likeStatus: 'InvalidStatus',
    };

    await request(server)
      .put(`/comments/${createdCommentId}/like-status`)
      .set('Authorization', `Bearer ${userTokens[0]}`)
      .send(invalidData)
      .expect(400);
  });

  it('should handle like status changes correctly', async () => {
    // Пользователь 1 ставит лайк
    await request(server)
      .put(`/comments/${createdCommentId}/like-status`)
      .set('Authorization', `Bearer ${userTokens[0]}`)
      .send({ likeStatus: LikeStatus.Like })
      .expect(204);

    // Проверяем, что лайк добавился
    let response = await request(server)
      .get(`/comments/${createdCommentId}`)
      .set('Authorization', `Bearer ${userTokens[0]}`)
      .expect(200);

    expect(response.body.likesInfo).toHaveProperty('likesCount', 3);
    expect(response.body.likesInfo).toHaveProperty('myStatus', 'Like');

    // Пользователь 1 меняет лайк на дизлайк
    await request(server)
      .put(`/comments/${createdCommentId}/like-status`)
      .set('Authorization', `Bearer ${userTokens[0]}`)
      .send({ likeStatus: LikeStatus.Dislike })
      .expect(204);

    // Проверяем, что лайк изменился на дизлайк
    response = await request(server)
      .get(`/comments/${createdCommentId}`)
      .set('Authorization', `Bearer ${userTokens[0]}`)
      .expect(200);

    expect(response.body.likesInfo).toHaveProperty('likesCount', 2);
    expect(response.body.likesInfo).toHaveProperty('dislikesCount', 2);
    expect(response.body.likesInfo).toHaveProperty('myStatus', 'Dislike');

    // Пользователь 1 убирает дизлайк
    await request(server)
      .put(`/comments/${createdCommentId}/like-status`)
      .set('Authorization', `Bearer ${userTokens[0]}`)
      .send({ likeStatus: LikeStatus.None })
      .expect(204);

    // Проверяем, что дизлайк убрался
    response = await request(server)
      .get(`/comments/${createdCommentId}`)
      .set('Authorization', `Bearer ${userTokens[0]}`)
      .expect(200);

    expect(response.body.likesInfo).toHaveProperty('likesCount', 2);
    expect(response.body.likesInfo).toHaveProperty('dislikesCount', 1);
    expect(response.body.likesInfo).toHaveProperty('myStatus', 'None');
  });
});

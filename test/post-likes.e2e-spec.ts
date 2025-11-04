/* eslint-disable */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Server } from 'http';
import { E2ETestHelper } from './helpers/e2e-test-helper';
import { LikePostInputDto } from '../src/modules/content-manage/posts/api/input-dto/likesPost/like-post.input.dto';
import { LikeStatus } from '../src/modules/content-manage/posts/api/input-dto/likesPost/like-status.enum';
import { PostViewDto } from '../src/modules/content-manage/posts/api/view-dto/post.view-dto';
import { CreatePostInputDto } from '../src/modules/content-manage/posts/api/input-dto/create-post.input.dto';

describe('Post Likes (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let createdPostId: string | null = null;
  let createdBlogId: string | null = null;
  let userToken: string | null = null;
  let userId: string | null = null;

  // Базовые учетные данные для тестов
  const adminCredentials = Buffer.from('admin:qwerty').toString('base64');

  beforeAll(async () => {
    const testSetup = await E2ETestHelper.createTestingApp();
    app = testSetup.app;
    server = testSetup.server;

    // Создаем блог для тестирования постов
    const blogData = {
      name: 'TestBlogLikes', // 6-20 символов
      description: 'This is a test blog for testing likes functionality', // 6-100 символов
      websiteUrl: 'https://testblogforlikes.com',
      createdAt: new Date().toISOString(),
      isMembership: false,
    };

    const blogResponse = await request(server)
      .post('/sa/blogs')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(blogData)
      .expect(201);

    createdBlogId = blogResponse.body.id;

    // Создаем пост для тестирования лайков
    const postData: CreatePostInputDto = {
      title: 'Test Post for Likes', // 6-30 символов
      shortDescription: 'Test post for likes functionality', // 6-100 символов
      content:
        'This is a test post content with sufficient length to meet validation requirements for testing likes', // 6-1000 символов (95 символов)
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
      login: 'testuser', // 3-10 символов
      password: 'password123', // 6-20 символов
      email: 'test@example.com',
    };

    const userResponse = await request(server)
      .post('/sa/users')
      .set('Authorization', `Basic ${adminCredentials}`)
      .send(userData)
      .expect(201);

    userId = userResponse.body.id;

    // Логинимся пользователем
    const loginResponse = await request(server)
      .post('/auth/login')
      .send({
        loginOrEmail: userData.login,
        password: userData.password,
      })
      .expect(200);

    userToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await E2ETestHelper.cleanup(app, server);
  });

  describe('Like Status Validation', () => {
    it('should accept valid statuses and reject invalid ones', async () => {
      // Валидные статусы
      const validStatuses = [
        LikeStatus.Like,
        LikeStatus.Dislike,
        LikeStatus.None,
      ];
      for (const status of validStatuses) {
        await request(server)
          .put(`/posts/${createdPostId}/like-status`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ likeStatus: status })
          .expect(204);
      }

      // Невалидные статусы
      const invalidData = [
        { likeStatus: 'InvalidStatus' },
        { likeStatus: '' },
        {},
        { likeStatus: null },
        { likeStatus: undefined },
      ];

      for (const data of invalidData) {
        await request(server)
          .put(`/posts/${createdPostId}/like-status`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(data)
          .expect(400);
      }
    });
  });

  describe('Authentication Requirements', () => {
    it('should require valid JWT authentication', async () => {
      const likeData: LikePostInputDto = {
        likeStatus: LikeStatus.Like,
      };

      // Без авторизации
      await request(server)
        .put(`/posts/${createdPostId}/like-status`)
        .send(likeData)
        .expect(401);

      // Невалидный токен
      await request(server)
        .put(`/posts/${createdPostId}/like-status`)
        .set('Authorization', 'Bearer invalid-token')
        .send(likeData)
        .expect(401);

      // Неправильный тип авторизации
      await request(server)
        .put(`/posts/${createdPostId}/like-status`)
        .set('Authorization', `Basic ${adminCredentials}`)
        .send(likeData)
        .expect(401);
    });
  });

  describe('Like Status Transitions', () => {
    it('should handle all status transitions correctly', async () => {
      // Тестируем переходы: Like -> None -> Dislike
      const transitions = [
        { from: 'None', to: LikeStatus.Like },
        { from: 'Like', to: LikeStatus.None },
        { from: 'None', to: LikeStatus.Dislike },
      ];

      for (const transition of transitions) {
        await request(server)
          .put(`/posts/${createdPostId}/like-status`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ likeStatus: transition.to })
          .expect(204);
      }

      // Проверяем финальное состояние (без авторизации для GET запроса)
      const response = await request(server)
        .get(`/posts/${createdPostId}`)
        .expect(200);

      const post: PostViewDto = response.body;
      expect(post.extendedLikesInfo.myStatus).toBe(LikeStatus.None); // Без авторизации всегда None

      // После переходов Like -> None -> Dislike, в итоге остается только дизлайк
      expect(post.extendedLikesInfo.likesCount).toBe(0); // Лайка нет
      expect(post.extendedLikesInfo.dislikesCount).toBe(1); // Дизлайк есть
    });
  });

  describe('Multiple Users Likes', () => {
    let secondUserToken: string | null = null;

    beforeAll(async () => {
      // Создаем второго пользователя через админский эндпоинт
      const secondUserData = {
        login: 'testuser2', // 3-10 символов
        password: 'password123', // 6-20 символов
        email: 'test2@example.com',
      };

      await request(server)
        .post('/sa/users')
        .set('Authorization', `Basic ${adminCredentials}`)
        .send(secondUserData)
        .expect(201);

      // Логинимся вторым пользователем
      const loginResponse = await request(server)
        .post('/auth/login')
        .send({
          loginOrEmail: secondUserData.login,
          password: secondUserData.password,
        })
        .expect(200);

      secondUserToken = loginResponse.body.accessToken;
    });

    it('should handle likes from multiple users with mixed reactions', async () => {
      // Первый пользователь ставит лайк
      await request(server)
        .put(`/posts/${createdPostId}/like-status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ likeStatus: LikeStatus.Like })
        .expect(204);

      // Второй пользователь ставит дизлайк
      await request(server)
        .put(`/posts/${createdPostId}/like-status`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({ likeStatus: LikeStatus.Dislike })
        .expect(204);

      // Проверяем, что оба типа реакций учтены (без авторизации для GET запроса)
      const response = await request(server)
        .get(`/posts/${createdPostId}`)
        .expect(200);

      const post: PostViewDto = response.body;
      expect(post.extendedLikesInfo.likesCount).toBeGreaterThan(0);
      expect(post.extendedLikesInfo.dislikesCount).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Boundary Values', () => {
    it('should handle rapid changes and edge cases', async () => {
      // Быстрые последовательные изменения
      const statuses = [
        LikeStatus.Like,
        LikeStatus.Dislike,
        LikeStatus.None,
        LikeStatus.Like,
      ];
      for (const status of statuses) {
        await request(server)
          .put(`/posts/${createdPostId}/like-status`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ likeStatus: status })
          .expect(204);
      }

      // Повторные одинаковые статусы
      await request(server)
        .put(`/posts/${createdPostId}/like-status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ likeStatus: LikeStatus.Like })
        .expect(204);

      await request(server)
        .put(`/posts/${createdPostId}/like-status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ likeStatus: LikeStatus.Like })
        .expect(204);

      // Дополнительные поля в запросе
      await request(server)
        .put(`/posts/${createdPostId}/like-status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          likeStatus: LikeStatus.Like,
          extraField: 'should be ignored',
          anotherField: 123,
        })
        .expect(204);

      // Проверяем финальное состояние
      const response = await request(server)
        .get(`/posts/${createdPostId}`)
        .expect(200);

      const post: PostViewDto = response.body;
      expect(post.extendedLikesInfo.myStatus).toBe(LikeStatus.None); // Без авторизации всегда None
    });
  });

  describe('Response Validation', () => {
    it('should return correct extended likes info structure and newestLikes format', async () => {
      // Ставим лайк для проверки структуры
      await request(server)
        .put(`/posts/${createdPostId}/like-status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ likeStatus: LikeStatus.Like })
        .expect(204);

      const response = await request(server)
        .get(`/posts/${createdPostId}`)
        .expect(200);

      const post: PostViewDto = response.body;

      // Проверяем структуру extendedLikesInfo
      expect(post.extendedLikesInfo).toBeDefined();
      expect(typeof post.extendedLikesInfo.likesCount).toBe('number');
      expect(typeof post.extendedLikesInfo.dislikesCount).toBe('number');
      expect(post.extendedLikesInfo.myStatus).toBe(LikeStatus.None); // Без авторизации всегда None
      expect(post.extendedLikesInfo.newestLikes).toBeDefined();

      // Проверяем формат newestLikes
      if (
        post.extendedLikesInfo.newestLikes &&
        post.extendedLikesInfo.newestLikes.length > 0
      ) {
        expect(Array.isArray(post.extendedLikesInfo.newestLikes)).toBe(true);
        expect(post.extendedLikesInfo.newestLikes.length).toBeLessThanOrEqual(
          3,
        );

        const newestLike = post.extendedLikesInfo.newestLikes[0];
        expect(newestLike).toHaveProperty('addedAt');
        expect(newestLike).toHaveProperty('userId');
        expect(newestLike).toHaveProperty('login');
        expect(typeof newestLike.addedAt).toBe('string');
        expect(typeof newestLike.userId).toBe('string');
        expect(typeof newestLike.login).toBe('string');
      }
    });
  });
});

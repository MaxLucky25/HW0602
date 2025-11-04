// Jest setup file для установки переменных окружения
import { join } from 'path';

// Принудительно устанавливаем переменные окружения для тестов
process.env.NODE_ENV = 'testing';
process.env.ENV_FILE_PATH = join('env', '.env.testing');

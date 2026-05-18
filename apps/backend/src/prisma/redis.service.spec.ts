import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';

describe('RedisService', () => {
  let service: RedisService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    // Trigger onModuleInit to mock client internally since we are in test environment
    service.onModuleInit();
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('Operações de Cache', () => {
    it('deve retornar null para chaves inexistentes no cache', async () => {
      const result = await service.get('chave_inexistente');
      expect(result).toBeNull();
    });

    it('deve serializar e desserializar objetos corretamente', async () => {
      const mockObject = { id: 1, name: 'Grupo de Teste', score: 100 };
      
      // Mock do client para simular armazenamento
      const spyGet = jest.spyOn(service['client'], 'get').mockResolvedValue(JSON.stringify(mockObject));
      const spySet = jest.spyOn(service['client'], 'set').mockResolvedValue('OK');

      await service.set('grupo:1', mockObject, 30);
      const result = await service.get('grupo:1');

      expect(spySet).toHaveBeenCalledWith('grupo:1', JSON.stringify(mockObject), 'EX', 30);
      expect(spyGet).toHaveBeenCalledWith('grupo:1');
      expect(result).toEqual(mockObject);
    });

    it('deve remover chaves deletadas', async () => {
      const spyDel = jest.spyOn(service['client'], 'del').mockResolvedValue(1);

      await service.del('grupo:1');

      expect(spyDel).toHaveBeenCalledWith('grupo:1');
    });

    it('deve invalidar chaves por padrão regex / wildcard', async () => {
      const mockKeys = ['group:details:1', 'group:details:2'];
      const spyKeys = jest.spyOn(service['client'], 'keys').mockResolvedValue(mockKeys);
      const spyDel = jest.spyOn(service['client'], 'del').mockResolvedValue(2);

      await service.delByPattern('group:details:*');

      expect(spyKeys).toHaveBeenCalledWith('group:details:*');
      expect(spyDel).toHaveBeenCalledWith(...mockKeys);
    });

    it('não deve chamar del se nenhuma chave corresponder ao padrão wildcard', async () => {
      const spyKeys = jest.spyOn(service['client'], 'keys').mockResolvedValue([]);
      const spyDel = jest.spyOn(service['client'], 'del');

      await service.delByPattern('grupo:vazio:*');

      expect(spyKeys).toHaveBeenCalledWith('grupo:vazio:*');
      expect(spyDel).not.toHaveBeenCalled();
    });
  });
});

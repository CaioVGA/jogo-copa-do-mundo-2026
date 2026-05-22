import { crc16Ccitt, generatePixPayload } from './pix';

describe('Pix Utility', () => {
  describe('crc16Ccitt', () => {
    it('should compute the correct CRC16 checksum for a simple string', () => {
      // Test using standard CCITT-FALSE test vector: "123456789" -> 0x29B1
      const testStr = '123456789';
      const checksum = crc16Ccitt(testStr);
      expect(checksum).toHaveLength(4);
      expect(checksum).toBe('29B1');
    });
  });

  describe('generatePixPayload', () => {
    it('should return empty string if no pixKey is provided', () => {
      expect(generatePixPayload('', 'CAIO')).toBe('');
    });

    it('should return the pasted copia e cola code directly if it already starts with 000201', () => {
      const code = '00020126360014br.gov.bcb.pix0114teste@email.com5204000053039865802BR5904CAIO6008BRASILIA62070503***63041660';
      expect(generatePixPayload(code, 'OTHER')).toBe(code);
    });

    it('should format a raw key as standard static Pix payload', () => {
      const payload = generatePixPayload('teste@email.com', 'Caio Araújo');
      
      // Basic checks
      expect(payload).toContain('000201'); // format indicator
      expect(payload).toContain('br.gov.bcb.pix'); // merchant identifier
      expect(payload).toContain('teste@email.com'); // key
      expect(payload).toContain('CAIO ARAUJO'); // name cleaned (uppercase, no accents)
      expect(payload).toContain('BRASILIA'); // default city
      expect(payload).toContain('6304'); // CRC indicator
      
      // Verify structure length
      const crc = payload.slice(-4);
      const expectedPart1 = payload.slice(0, -4);
      expect(crc16Ccitt(expectedPart1)).toBe(crc);
    });
  });
});

/**
 * Computes CRC16 CCITT checksum (initial: 0xFFFF, polynomial: 0x1021)
 */
export function crc16Ccitt(str: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Generates the BR Code / Pix Copy and Paste payload for a static Pix QR Code
 * @param pixKey Raw Pix key (CPF, email, phone, random key) or an already formatted Pix Copia e Cola
 * @param merchantName Name of the merchant (defaults to owner/group name, max 25 chars)
 * @param city City of the transaction (defaults to BRASILIA, max 15 chars)
 */
export function generatePixPayload(
  pixKey: string,
  merchantName: string,
  city = 'BRASILIA',
): string {
  if (!pixKey) return '';

  const trimmedKey = pixKey.trim();
  // If the user pasted a full "Copia e Cola" code, it already starts with "000201". We can return it directly.
  if (trimmedKey.startsWith('000201')) {
    return trimmedKey;
  }

  // Construct static Pix payload according to BCB specifications
  // Payload Format Indicator (ID 00) -> '01'
  const payloadFormat = formatField('00', '01');

  // Merchant Account Info (ID 26)
  // GUI (00): "br.gov.bcb.pix"
  // Key (01): The Pix key
  const gui = formatField('00', 'br.gov.bcb.pix');
  const key = formatField('01', trimmedKey);
  const merchantAccountInfo = formatField('26', gui + key);

  // Category Code (ID 52) -> '0000'
  const categoryCode = formatField('52', '0000');

  // Currency (ID 53) -> '986' (BRL)
  const currency = formatField('53', '986');

  // Country (ID 58) -> 'BR'
  const country = formatField('58', 'BR');

  // Merchant Name (ID 59) - Clean and capitalize, max 25 chars.
  const cleanName = merchantName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-zA-Z0-9 ]/g, '') // alphanumeric and spaces only
    .substring(0, 25)
    .toUpperCase()
    .trim();
  const nameField = formatField('59', cleanName || 'USER');

  // Merchant City (ID 60) - Clean and capitalize, max 15 chars.
  const cleanCity = city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-zA-Z0-9 ]/g, '') // alphanumeric and spaces only
    .substring(0, 15)
    .toUpperCase()
    .trim();
  const cityField = formatField('60', cleanCity || 'BRASILIA');

  // Additional Data Field (ID 62)
  // Reference Label (05) -> '***' (indicating value is generated dynamically or not specified)
  const reference = formatField('05', '***');
  const additionalData = formatField('62', reference);

  // Assemble before CRC16 calculation
  // "6304" represents ID 63 with length 04, standard ending for CRC
  const part1 =
    payloadFormat +
    merchantAccountInfo +
    categoryCode +
    currency +
    nameField +
    cityField +
    additionalData +
    '6304';

  const crc = crc16Ccitt(part1);
  return part1 + crc;
}

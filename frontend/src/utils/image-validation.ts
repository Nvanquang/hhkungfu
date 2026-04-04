/**
 * Tiện ích validate ảnh với các tiêu chuẩn bảo mật khắt khe:
 * 1. Giới hạn kích thước (2MB)
 * 2. Whitelist extension (jpg, jpeg, png, webp)
 * 3. Kiểm tra Magic Bytes (chống giả extension)
 * 4. Quét nội dung SVG/XML (chống XSS/XXE/SSRF)
 * 5. Kiểm tra kích thước pixel (chống Pixel Flood/DoS)
 */

export const validateImage = async (file: File): Promise<{ valid: boolean; error?: string }> => {
  // 1. Kiểm tra kích thước (2MB)
  const MAX_SIZE_BYTES = 2 * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    return { valid: false, error: "Ảnh không được vượt quá 2MB" };
  }

  // 2. Kiểm tra phần mở rộng (extension)
  const allowedExts = ["jpg", "jpeg", "png", "webp"];
  const fileName = file.name.toLowerCase();
  const ext = fileName.split(".").pop();
  
  if (!ext || !allowedExts.includes(ext)) {
    return { valid: false, error: "Chỉ chấp nhận định dạng JPG, PNG hoặc WEBP" };
  }

  // Chặn tên file chứa ký tự nguy hiểm (giống backend)
  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    return { valid: false, error: "Tên file chứa ký tự không hợp lệ" };
  }

  // 3. Kiểm tra Magic Bytes (File Signature)
  // Đọc 4 byte đầu tiên
  const buffer = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
  const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46; // "RIFF" (WebP header)
  
  if (!isJpeg && !isPng && !isWebp) {
    return { valid: false, error: "Nội dung file không hợp lệ hoặc bị giả mạo định dạng" };
  }

  // 4. Quét SVG / XML (Chống XSS/XXE thông qua file ảnh giả)
  // Đọc 512 byte đầu tiên để tìm kiếm các thẻ nguy hiểm
  const headerTextBlob = file.slice(0, 512);
  const headerText = await headerTextBlob.text();
  const lowerHeader = headerText.toLowerCase();
  
  if (
    lowerHeader.includes("<svg") || 
    lowerHeader.includes("<!entity") || 
    lowerHeader.includes("<?xml")
  ) {
    return { valid: false, error: "Định dạng SVG/XML không được chấp nhận vì lý do bảo mật" };
  }

  // 5. Kiểm tra kích thước thực tế (Pixel Flood Protection/Decompression Bomb)
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_DIMENSION = 5000;
      
      if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
        resolve({ 
          valid: false, 
          error: `Kích thước ảnh không được vượt quá ${MAX_DIMENSION}x${MAX_DIMENSION}px` 
        });
        return;
      }
      
      if (img.width * img.height > MAX_DIMENSION * MAX_DIMENSION) {
        resolve({ 
          valid: false, 
          error: "Độ phân giải ảnh quá lớn, có khả năng gây quá tải hệ thống" 
        });
        return;
      }
      
      resolve({ valid: true });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ valid: false, error: "File ảnh bị hỏng hoặc không thể đọc được" });
    };

    img.src = objectUrl;
  });
};

const fs = require('fs');

// bundle.js 읽기
const bundleContent = fs.readFileSync('public/bundle.js', 'utf8');

// 간단한 압축 해제 (공백과 줄바꿈 추가)
const decompressed = bundleContent
    .replace(/;/g, ';\n')
    .replace(/{/g, '{\n')
    .replace(/}/g, '\n}\n')
    .replace(/,/g, ',\n')
    .replace(/\n\s*\n/g, '\n');

// 압축 해제된 파일 저장
fs.writeFileSync('public/bundle_decompressed.js', decompressed);

console.log('Bundle.js 압축 해제 완료!');

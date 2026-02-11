// upgrade_deploy_to_r2.js
const fs = require('fs');
const path = require('path');

console.log('🆙 正在升级部署脚本以支持 R2...');

const newScriptContent = `
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceDir = '.open-next';
const deployDir = '_deploy_stage';

console.log('📦 准备进行“全量迁移 + R2”部署...');

if (fs.existsSync(deployDir)) {
    fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir);

console.log('   🚚 复制构建产物...');
try {
    fs.cpSync(sourceDir, deployDir, { recursive: true });
} catch (e) {
    console.error('复制失败，请确保 .open-next 存在');
    process.exit(1);
}

// 生成包含 R2 配置的 wrangler.json
const cleanConfig = {
    name: "shipany-template-two",
    main: "worker.js", 
    compatibility_date: "2024-09-23",
    compatibility_flags: ["nodejs_compat"],
    assets: {
        directory: "assets",
        binding: "ASSETS"
    },
    // 🔥 关键配置：绑定我们刚创建的 bucket
    r2_buckets: [
        {
            binding: "NEXT_INC_CACHE_R2_BUCKET", // OpenNext 识别的变量名
            bucket_name: "next-cache"             // 你刚创建的桶的名字
        }
    ],
    kv_namespaces: [] 
};

fs.writeFileSync(
    path.join(deployDir, 'wrangler.json'), 
    JSON.stringify(cleanConfig, null, 2)
);
console.log('   ✅ 配置文件已生成 (R2: next-cache 已绑定)');

console.log('🚀 启动 Wrangler 部署...');
try {
    execSync('npx wrangler deploy', { 
        cwd: deployDir, 
        stdio: 'inherit' 
    });
    console.log('🎉 部署成功！R2 缓存已连接。');
} catch (error) {
    console.error('❌ 部署中断。');
}
`;

fs.writeFileSync('manual_deploy_full.js', newScriptContent);
console.log('✅ manual_deploy_full.js 已更新完毕！');
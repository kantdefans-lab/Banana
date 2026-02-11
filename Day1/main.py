import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms


# -------------------- 数据准备 --------------------
transform = transforms.ToTensor()  # 把图片转为 [0,1] 的张量
train_dataset = datasets.MNIST(root="data", train=True, download=True, transform=transform)
test_dataset = datasets.MNIST(root="data", train=False, download=True, transform=transform)
train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True)  # 训练集打乱更好
test_loader = DataLoader(test_dataset, batch_size=256, shuffle=False)


# -------------------- 模型定义 --------------------
class MLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(28 * 28, 128)  # 输入层 -> 隐藏层1
        self.fc2 = nn.Linear(128, 64)       # 隐藏层1 -> 隐藏层2
        self.fc3 = nn.Linear(64, 10)        # 隐藏层2 -> 输出层(10类)
        self.relu = nn.ReLU()               # 非线性激活函数

    def forward(self, x):
        x = x.view(x.size(0), -1)           # 把图片拉平成向量
        x = self.relu(self.fc1(x))          # Linear + ReLU
        x = self.relu(self.fc2(x))          # Linear + ReLU
        x = self.fc3(x)                     # 输出 logits
        return x


# -------------------- 训练配置 --------------------
device = torch.device("cpu")  # CPU 可运行；如需 GPU 可改为 cuda
model = MLP().to(device)
criterion = nn.CrossEntropyLoss()          # 分类任务常用损失
optimizer = torch.optim.SGD(model.parameters(), lr=0.1)  # 最基础优化器


# -------------------- 训练循环 --------------------
epochs = 5
for epoch in range(1, epochs + 1):
    model.train()                          # 切到训练模式
    total_loss = 0.0

    for images, labels in train_loader:
        images = images.to(device)         # 数据搬到设备
        labels = labels.to(device)

        optimizer.zero_grad()              # 清空上一轮的梯度
        logits = model(images)             # forward
        loss = criterion(logits, labels)   # 计算 loss
        loss.backward()                    # backward
        optimizer.step()                   # 更新参数

        total_loss += loss.item()

    # -------------------- 评估准确率 --------------------
    model.eval()                           # 切到评估模式
    correct = 0
    total = 0
    with torch.no_grad():                  # 评估时不需要梯度
        for images, labels in test_loader:
            images = images.to(device)
            labels = labels.to(device)
            logits = model(images)
            preds = logits.argmax(dim=1)   # 取最大值位置作为预测类别
            correct += (preds == labels).sum().item()
            total += labels.size(0)

    avg_loss = total_loss / max(1, len(train_loader))
    acc = correct / max(1, total)
    print(f"epoch {epoch} | train loss: {avg_loss:.4f} | test acc: {acc:.4f}")

import torch

x = torch.randn(10, 3)
w = torch.randn(3, 1)
y = x @ w

print(y.shape)

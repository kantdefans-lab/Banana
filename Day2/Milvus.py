import os
from tqdm import tqdm
# tqdm 是一个 Python 库，用于显示循环的进度条，特别适用于处理大量数据时
# 可以让用户直观地看到处理进度。
from glob import glob
# glob 是一个 Python 模块，用于查找符合特定模式的文件路径名。
# 它提供了一个函数 glob()，可以使用通配符来匹配文件路径。
import torch
from visual_bge.visual_bge.modeling import Visualized_BGE
from pymilvus import MilvusClient, FieldSchema, CollectionSchema, DataType
# Milvus 是一个开源的向量数据库，专门用于存储和检索高维向量数据。
# pymilvus 是 Milvus 的 Python 客户端库，提供了与 Milvus 数据库交互的接口。
#
import numpy as np
import cv2
# OpenCV 是一个开源的计算机视觉库，提供了丰富的图像处理和计算机视觉功能。
from PIL import Image
# PIL（Python Imaging Library）是一个用于图像处理的库，提供了丰富的图像操作功能。

# 1. 初始化设置
MODEL_NAME = "BAAI/bge-base-en-v1.5"
MODEL_PATH = "../../models/bge/Visualized_base_en_v1.5.pth"
DATA_DIR = "../../data/C3"
COLLECTION_NAME = "multimodal_demo"
MILVUS_URI = "http://localhost:19530"
#19530 是 Milvus 常用端口之一（实际以你的部署为准）。

# 2. 定义工具 (编码器和可视化函数)
class Encoder:
    """编码器类，用于将图像和文本编码为向量。"""
    def __init__(self, model_name: str, model_path: str):
        self.model = Visualized_BGE(model_name_bge=model_name, model_weight=model_path)
        self.model.eval()
        # 设置模型为评估模式

    def encode_query(self, image_path: str, text: str) -> list[float]:
        with torch.no_grad():
            query_emb = self.model.encode(image=image_path, text=text)
            #传入图像和文本，返回联合向量
        return query_emb.tolist()[0]
        # 转换为列表格式并返回 一维列表
    def encode_image(self, image_path: str) -> list[float]:
        with torch.no_grad():
            query_emb = self.model.encode(image=image_path)
            #只传入图像，返回图像向量
        return query_emb.tolist()[0]
    # 转换为列表格式并返回 一维列表

def visualize_results(query_image_path: str, retrieved_images: list, img_height: int = 300, img_width: int = 300, row_count: int = 3) -> np.ndarray:
    """从检索到的图像列表创建一个全景图用于可视化。"""，可视化函数
    panoramic_width = img_width * row_count
    panoramic_height = img_height * row_count
    #
    panoramic_image = np.full((panoramic_height, panoramic_width, 3), 255, dtype=np.uint8)
    #生成一个白色背景的图
    query_display_area = np.full((panoramic_height, img_width, 3), 255, dtype=np.uint8)
    #生成一个白色背景的用来放查询图，
    # 处理查询图像

    query_pil = Image.open(query_image_path).convert("RGB")
    #转换为RGB格式 query就是打开的图像

    query_cv = np.array(query_pil)[:, :, ::-1]
    #把RGB转为BGR格式，opencv是BGR格式的

    resized_query = cv2.resize(query_cv, (img_width, img_height))
    #调整为指定大小，统一口径
    bordered_query = cv2.copyMakeBorder(resized_query, 10, 10, 10, 10, cv2.BORDER_CONSTANT, value=(255, 0, 0))
    #给查询图加边框，蓝色边框
    query_display_area[img_height * (row_count - 1):, :] = cv2.resize(bordered_query, (img_width, img_height))
    #把查询图放到底部
    cv2.putText(query_display_area, "Query", (10, panoramic_height - 20), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
    #左侧底部添加“Query”标签

    # 处理检索到的图像
    for i, img_path in enumerate(retrieved_images):
        row, col = i // row_count, i % row_count
        #计算图像在全景图中的位置
        start_row, start_col = row * img_height, col * img_width
        # 读取并调整图像大小
        
        retrieved_pil = Image.open(img_path).convert("RGB")
        #转化为RGB
        retrieved_cv = np.array(retrieved_pil)[:, :, ::-1]
        #转化为BGR，opencv格式

        resized_retrieved = cv2.resize(retrieved_cv, (img_width - 4, img_height - 4))
        #调整大小，比格子小一点，留边框位置，所以减4
        bordered_retrieved = cv2.copyMakeBorder(resized_retrieved, 2, 2, 2, 2, cv2.BORDER_CONSTANT, value=(0, 0, 0))
        #添加黑色边框，000，调整颜色和厚度
        panoramic_image[start_row:start_row + img_height, start_col:start_col + img_width] = bordered_retrieved
        # 放入全景图中
        
        # 添加索引号
        cv2.putText(panoramic_image, str(i), (start_col + 10, start_row + 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        #打印红色的索引号

    return np.hstack([query_display_area, panoramic_image])
    #最后输出。


# 3. 初始化客户端
print("--> 正在初始化编码器和Milvus客户端...")
encoder = Encoder(MODEL_NAME, MODEL_PATH)
#用前面初始设置的值，来构建BGE编码器
milvus_client = MilvusClient(uri=MILVUS_URI)
#创建 Milvus 客户端实例，连接到指定的 URI

# 4. 创建 Milvus Collection
print(f"\n--> 正在创建 Collection '{COLLECTION_NAME}'")
#确定这个collection是哪一个
if milvus_client.has_collection(COLLECTION_NAME):
    #如果已经存在同名的 collection，先删除它，以确保干净的环境
    milvus_client.drop_collection(COLLECTION_NAME)
    #删除 collection 后，Milvus 会自动清理相关的索引和数据，因此不需要额外的步骤来删除索引。
    print(f"已删除已存在的 Collection: '{COLLECTION_NAME}'")

image_list = glob(os.path.join(DATA_DIR, "dragon", "*.png"))
#使用 glob 模块查找指定目录下的所有 .png 图像文件，并将它们的路径存储在 image_list 中。，此时还没转换
if not image_list:
    raise FileNotFoundError(f"在 {DATA_DIR}/dragon/ 中未找到任何 .png 图像。")
#确保找到了图像文件，否则报错
dim = len(encoder.encode_image(image_list[0]))
#获取图像向量的维度，通过编码第一张图像来确定，确定维度，随便一张都行，只是看看目前模型的输出维度是多少

fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
    #主键字段，自动生成
    FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=dim),
    #向量字段，dim保证维度必须等同于模型输出维度
    FieldSchema(name="image_path", dtype=DataType.VARCHAR, max_length=512),
    #存储图像路径的字段，最大长度512
]

# 创建集合 Schema
schema = CollectionSchema(fields, description="多模态图文检索")
print("Schema 结构:")
print(schema)

# 创建集合
milvus_client.create_collection(collection_name=COLLECTION_NAME, schema=schema)
#把前俩给合起来，做一个 collection
print(f"成功创建 Collection: '{COLLECTION_NAME}'")
print("Collection 结构:")
print(milvus_client.describe_collection(collection_name=COLLECTION_NAME))
#打印 collection 结构，确认无误

# 5. 准备并插入数据
print(f"\n--> 正在向 '{COLLECTION_NAME}' 插入数据")
data_to_insert = []
#准备插入的数据列表
for image_path in tqdm(image_list, desc="生成图像嵌入"):
    #tqdm 显示进度条
    vector = encoder.encode_image(image_path)
    #对每一张图像进行编码，得到向量
    data_to_insert.append({"vector": vector, "image_path": image_path})
#把向量和图像路径放到字典里，添加到列表中，append 方法用于在列表末尾添加一个新元素。

if data_to_insert:
    #列表不是空的，进行下一步字典转移
    result = milvus_client.insert(collection_name=COLLECTION_NAME, data=data_to_insert)
    #插入数据到 Milvus collection 中
    print(f"成功插入 {result['insert_count']} 条数据。")

# 6. 创建索引
print(f"\n--> 正在为 '{COLLECTION_NAME}' 创建索引")
index_params = milvus_client.prepare_index_params()
#准备索引容器
index_params.add_index(
    #索引器
    field_name="vector",
    index_type="HNSW",
    #索引检索方法
    metric_type="COSINE",
    #相似度用余弦相似度
    params={"M": 16, "efConstruction": 256}
    #HNSW 索引的参数设置
)
milvus_client.create_index(collection_name=COLLECTION_NAME, index_params=index_params)
#创建索引
print("成功为向量字段创建 HNSW 索引。")
print("索引详情:")
print(milvus_client.describe_index(collection_name=COLLECTION_NAME, index_name="vector"))
#打印索引详情
milvus_client.load_collection(collection_name=COLLECTION_NAME)
#加载 collection 到内存中，准备检索
print("已加载 Collection 到内存中。")

# 7. 执行多模态检索！！
print(f"\n--> 正在 '{COLLECTION_NAME}' 中执行检索")
query_image_path = os.path.join(DATA_DIR, "dragon", "query.png")
#查询图像路径
query_text = "一条龙"
query_vector = encoder.encode_query(image_path=query_image_path, text=query_text)
#对查询图像和文本进行编码，得到联合向量

search_results = milvus_client.search(
    collection_name=COLLECTION_NAME,
    data=[query_vector],
    output_fields=["image_path"],
    limit=5,
    search_params={"metric_type": "COSINE", "params": {"ef": 128}}
    #执行搜索，使用余弦相似度，返回前5个结果，ef 是 HNSW 搜索参数，控制搜索效率和准确率的平衡
)[0]
# search_results 是一个列表，包含了与查询向量最相似的结果，每个结果包含 id、距离（相似度）和输出字段（这里是 image_path）。
retrieved_images = []
print("检索结果:")
for i, hit in enumerate(search_results):
    print(f"  Top {i+1}: ID={hit['id']}, 距离={hit['distance']:.4f}, 路径='{hit['entity']['image_path']}'")
    retrieved_images.append(hit['entity']['image_path'])
    #打印检索结果的 ID、距离和图像路径，并将路径添加到 retrieved_images 列表中，供后续可视化使用。

# 8. 可视化与清理
print(f"\n--> 正在可视化结果并清理资源")
if not retrieved_images:
    print("没有检索到任何图像。")
else:
    panoramic_image = visualize_results(query_image_path, retrieved_images)
    #生成可视化图像，展示查询图像和检索结果
    combined_image_path = os.path.join(DATA_DIR, "search_result.png")
    #保存结果图像到指定路径
    cv2.imwrite(combined_image_path, panoramic_image)
    #保存图像到磁盘
    print(f"结果图像已保存到: {combined_image_path}")
    Image.open(combined_image_path).show()
    #在默认图像查看器中打开结果图像

milvus_client.release_collection(collection_name=COLLECTION_NAME)
#从内存中释放 collection，清理资源
print(f"已从内存中释放 Collection: '{COLLECTION_NAME}'")
milvus_client.drop_collection(COLLECTION_NAME)
#删除 collection，清理资源
print(f"已删除 Collection: '{COLLECTION_NAME}'")
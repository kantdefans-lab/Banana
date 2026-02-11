from unstructured.partition.auto import partition

# PDF文件路径
pdf_path = "../../data/C2/pdf/rag.pdf"

# 使用Unstructured加载并解析PDF文档
elements = partition(
    filename=pdf_path,
    content_type="application/pdf"
)
#自动解析元素，储存的也是元素
# 打印解析结果
print(f"解析完成: {len(elements)} 个元素, {sum(len(str(e)) for e in elements)} 字符")

# 统计元素类型
from collections import Counter
#python自带计数器，用来统计频率
types = Counter(e.category for e in elements)
#category统计元素的类型，counter生成字典{‘文本’：5，‘标题’：2}
print(f"元素类型: {dict(types)}")
#打印

# 显示所有元素
print("\n所有元素:")
for i, element in enumerate(elements, 1):
    #enumerate(elements, 1) 会在遍历 elements 的同时给每个元素配一个序号
    #，1代表从1开始计数，而不是默认的0
    print(f"Element {i} ({element.category}):")
    #打印序号和种类
    print(element)
    #打印元素内容
    print("=" * 60)
    #打印分隔线
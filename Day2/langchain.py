import os
# hugging face镜像设置，如果国内环境无法使用启用该设置
# os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'
from dotenv import load_dotenv #用于加载apikey 通常会在代码中再调用一次 load_dotenv()
from langchain_community.document_loaders import UnstructuredMarkdownLoader #markdown文档加载器导入，基于unstructured库，
#可以把.md 文件解析成 LangChain 的 Document 列表（包含 page_content 和 metadata），用于后续切分/向量化/检索。
from langchain_text_splitters import RecursiveCharacterTextSplitter 
#文本切分器 把长文本递归切分成更小的块，便于后续处理
from langchain_huggingface import HuggingFaceEmbeddings
#用来做文本嵌入的模型导入，基于 Hugging Face 的预训练模型，可以把文本转化为向量，做相似性检验
from langchain_core.vectorstores import InMemoryVectorStore
#向量存储库导入，用于存储和检索文本向量
from langchain_core.prompts import ChatPromptTemplate
#提示词模板导入，支持把系统/用户消息模板化
# 并用变量填充（{question}、{context} 等），生成可直接喂给 Chat 模型的 messages。
from langchain_openai import ChatOpenAI
#openai大语言模型导入，支持调用 OpenAI 及兼容的 LLM 服务
load_dotenv()
# 加载环境变量中的 API Key 等敏感信息，
markdown_path = "../../data/C1/markdown/easy-rl-chapter1.md"
#放入文件夹位置，提取文档到markdown_path对象（向量库），此时还没有加载文件
# 加载本地markdown文件
loader = UnstructuredMarkdownLoader(markdown_path)
#绑定文件到loader对象
docs = loader.load()
# 从loader中提取文档列表，docs是一个 Document 列表，每个 Document 包含 page_content 和 metadata
#page_content 是文本内容， metadata 是来源


# 文本分块
text_splitter = RecursiveCharacterTextSplitter()
#创建一个递归字符切分器，一个“器”，他的递归是指，可以从自然的边界到粗暴的边界的分隔符
#逐级拆分，比如先按段落，再按句子和空格，最后再切字符。
#在构建切分器的时候，可以调节默认属性，原来如此。
#text_splitter = RecursiveCharacterTextSplitter(
#    chunk_size=1000,        # 每个 chunk 最大字符数
#   chunk_overlap=200,      # 相邻 chunk 重叠字符数
#    separators=["\n\n", "\n", "。", "！", "？", ".", "!", "?", " ", ""],  # 可选：自定义切分优先级
#    length_function=len,    # 可选：长度计算方式（默认 len）
#    is_separator_regex=False,  # 可选：separators 是否按正则处理
#)
chunks = text_splitter.split_documents(docs)
# 把文档列表切分成更小的块，chunks 也是一个 Document 列表，
# 此时content变成更小的快，但是metadata依然保留原始文档的信息



# 中文嵌入模型开始构建！！
embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-small-zh-v1.5",
    #这里指定使用了一个BAAI的中文向量模型，应该是可替换的
    model_kwargs={'device': 'cpu'},
    #指定模型在什么设备上跑
    encode_kwargs={'normalize_embeddings': True}
    #归一化是让向量长度为1，方便计算余弦相似度，这样的话就变成方向和角度的计算了，
    #更看方向是否相似，在很多 embedding 模型里，训练目标就是让：
#语义相近的文本向量 夹角更小（方向更接近）
#语义不相关的文本向量 夹角更大

)
  
# 构建向量存储
vectorstore = InMemoryVectorStore(embeddings)
#创建一个向量库，他会使用刚刚的模型，把文本转化为向量，存到自己这里
vectorstore.add_documents(chunks)
#开始转化了，对每一个chunks都使用vectorsotre的方法：embeddings模型，转化成向量存储起来
#保存了向量（用来测相似度），文本和metadata（用来展示给用户）
#向量索引+知识索引，是一一对应的

# 提示词模板
prompt = ChatPromptTemplate.from_template("""请根据下面提供的上下文信息来回答问题。
请确保你的回答完全基于这些上下文。
如果上下文中没有足够的信息来回答问题，请直接告知：“抱歉，我无法根据提供的上下文找到相关信息来回答此问题。”

上下文:
{context}

问题: {question}

回答:"""
                                          )

# 配置大语言模型

# 使用 AIHubmix
llm = ChatOpenAI(
    model="glm-4.7-flash-free",
    #可调整的大模型
    temperature=0.7,
    #采样随机性。越大越发散、越小越稳定；0 更偏确定性输出
    max_tokens=4096,
    #单次生成的最大 token 数量限制
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    #调用
    base_url="https://aihubmix.com/v1"
    #对应的兼容接口，可以替换为其他兼容openai的接口
)

# llm = ChatOpenAI(
#     model="deepseek-chat",
#     temperature=0.7,
#     max_tokens=4096,
#     api_key=os.getenv("DEEPSEEK_API_KEY"),
#     base_url="https://api.deepseek.com"
# )

# 用户查询
question = "文中举了哪些例子？"

# 在向量存储中查询相关文档
retrieved_docs = vectorstore.similarity_search(question, k=3)
#先用向量库的嵌入模型把问题转化为向量，然后根据向量方向，去和所有的chunk向量算相似度
#返还k个最相似的chunk对应的Document列表（content和metadata）
docs_content = "\n\n".join(doc.page_content for doc in retrieved_docs)
#把Document列表中的content用for循环依此提取出来，把文本拼接乘长文本，并用
#两个换行符分割。双换行符通常代表段落的结束和新段落的开始，
# 这种格式有助于LLM将每个块视为一个独立的上下文来源，
# 从而更好地理解和利用这些信息来生成回答。

answer = llm.invoke(prompt.format(question=question, context=docs_content))
print(answer)
#print(answer.content) 只打印答案。
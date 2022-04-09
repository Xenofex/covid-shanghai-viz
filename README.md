上海2022年新型冠状病毒（covid-19）疫情各病例在地图上的分布。

数据使用每日“上海发布”公众号所发布的病例居住地址，html网页已包含在项目中

# 使用

需要nodejs以及`pnpm`。`pnpm`可以通过来安装

```shell
  npm install -g pnpm
```

## 常用命令：

本项目已经包含了最新已解析的数据，可以用`pnpm server`直接查看。

如果您希望自己改动代码，解析数据，需要申请百度地图APIKey，并且设置环境变量`BAIDU_MAP_API_KEY`为该API值。本项目包含了`dotenv`库，可以在
项目根目录下建立`.env`文件来设置改值，例如：

```shell
# .env文件内容
BAIDU_MAP_API_KEY=你的百度地图API KEY
```

```shell
pnpm start # 解析html网页，需要环境变量BAIDU_MAP_API_KEY
```
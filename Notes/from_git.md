# 相关链接：
# https://www.kancloud.cn/git-managment/git/476405
# https://git-scm.com/book

Git是版本控制工具 版本控制系统VCS
Git存储项目随时间改变的快照-基于差异delta-based版本控制
Git的所有操作本地执行，有三种状态：已提交commited、已修改modified、已暂存staged
对应有三个区域：工作区、暂存区、Git目录
基本的工作流程：工作区中修改文件；将下一次提交的更改选择性地暂存，只会将更改的部分添加到暂存区；提交更新，找到暂存的文件，将快照永久存储到Git目录

git版本的更新：
$ git clone git://git.kernel.org/pub/scm/git/git.git

git的配置：
查看所有的配置 $ git config --list --show-origin

获取帮助：
$ git help `<verb>`
$ git `<verb>` --help
$ man git-`<verb>`
使用 -h 获取简短的help

配置并初始化一个仓库（repository）、开始或停止跟踪（track）文件、暂存（stage）或提交（commit）更改
两种获取 Git 项目仓库的方式：将尚未进行版本控制的本地目录转换为 Git 仓库；从其它服务器 克隆 一个已存在的 Git 仓库
在已存在目录中初始化仓库：$ git init ---仅仅是做了一个初始化的动作
克隆现有的仓库：$ git clone <url> ; $ git clone `<url>` name ---增加额外参数指定新的目录名

工作目录下的每一个文件都不外乎这两种状态：已跟踪 或 未跟踪
查看当前文件状态：$ git status
使用 git status -s 命令或 git status --short 命令，你将得到一种格式更为紧凑的输出

忽略文件：
创建一个名为 .gitignore 文件，列出要忽略文件的模式
文件 .gitignore 的格式规范如下：
所有空行或者以 # 开头的行都会被 Git 忽略
可以使用标准的 glob 模式匹配，它会递归地应用在整个工作区中
匹配模式可以以（/）开头防止递归
匹配模式可以以（/）结尾指定目录
要忽略指定模式以外的文件或目录，可以在模式前加上叹号（!）取反

查看尚未暂存的文件更新: $ git diff ---此命令比较的是工作目录中当前文件和暂存区域快照之间的差异,也就是修改之后还没有暂存起来的变化内容
查看已暂存的将要添加到下次提交里的内容: $ git diff --staged ---比对已暂存文件与最后一次提交的文件差异
# 请注意，git diff 本身只显示尚未暂存的改动，而不是自上次提交以来所做的所有改动。 所以有时候你一下子暂存了所有更新过的文件，运行 git diff 后却什么也没有，就是这个原因。

提交更新:
每次准备提交前，先用 git status 看下，你所需要的文件是不是都已暂存起来了， 然后再运行提交命令 git commit
也可以在 commit 命令后添加 -m 选项，将提交信息与命令放在同一行

跳过使用暂存区的方式：
给 git commit 加上 -a 选项，Git 就会自动把所有已经跟踪过的文件暂存起来一并提交，从而跳过 git add 步骤


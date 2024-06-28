相关链接：
https://www.kancloud.cn/git-managment/git/476405
https://git-scm.com/book

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
$ git help <verb>
$ git <verb> --help
$ man git-<verb>
使用 -h 获取简短的help



配置并初始化一个仓库（repository）、开始或停止跟踪（track）文件、暂存（stage）或提交（commit）更改
两种获取 Git 项目仓库的方式：将尚未进行版本控制的本地目录转换为 Git 仓库；从其它服务器 克隆 一个已存在的 Git 仓库
在已存在目录中初始化仓库：$ git init ---仅仅是做了一个初始化的动作
克隆现有的仓库：$ git clone <url> ; $ git clone <url> name ---增加额外参数指定新的目录名

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

请注意，git diff 本身只显示尚未暂存的改动，而不是自上次提交以来所做的所有改动。 所以有时候你一下子暂存了所有更新过的文件，运行 git diff 后却什么也没有，就是这个原因。


提交更新:
每次准备提交前，先用 git status 看下，你所需要的文件是不是都已暂存起来了， 然后再运行提交命令 git commit
也可以在 commit 命令后添加 -m 选项，将提交信息与命令放在同一行

跳过使用暂存区的方式：
给 git commit 加上 -a 选项，Git 就会自动把所有已经跟踪过的文件暂存起来一并提交，从而跳过 git add 步骤
-a 选项使本次提交包含了所有修改过的文件
有时这个选项会将不需要的文件添加到提交中

移除文件：
从已跟踪文件清单中移除（确切地说，是从暂存区域移除），然后提交
git rm 命令完成此项工作，并连带从工作目录中删除指定的文件，这样以后就不会出现在未跟踪文件清单中
再运行 git rm 记录此次移除文件的操作,下一次提交时，该文件就不再纳入版本管理了
如果要删除之前修改过或已经放到暂存区的文件，则必须使用强制删除选项 -f（译注：即 force 的首字母）。 这是一种安全特性，用于防止误删尚未添加到快照的数据，这样的数据不能被 Git 恢复。

移动文件:
要在 Git 中对文件改名，可以这么做：$ git mv file_from file_to
运行 git mv 就相当于运行了下面三条命令：
$ mv README.md README
$ git rm README.md
$ git add README
git mv 是一条命令而非三条命令，直接使用 git mv 方便得多



查看提交历史：$ git log
不传入任何参数的默认情况下，git log 会按时间先后顺序列出所有的提交，最近的更新排在最上面
一个比较有用的选项是 -p 或 --patch ，它会显示每次提交所引入的差异（按 补丁 的格式输出）
也可以限制显示的日志条目数量，例如使用 -2 选项来只显示最近的两次提交
该选项除了显示基本信息之外，还附带了每次提交的变化
也可以为 git log 附带一系列的总结性选项
比如你想看到每次提交的简略统计信息，可以使用 --stat 选项
--stat 选项在每次提交的下面列出所有被修改过的文件、有多少文件被修改了以及被修改过的文件的哪些行被移除或是添加了
在每次提交的最后还有一个总结

另一个非常有用的选项是 --pretty，可以使用不同于默认格式的方式展示提交历史。
$ git log --pretty=oneline
这个选项有一些内建的子选项：oneline 会将每个提交放在一行显示，在浏览大量的提交时非常有用。
另外还有 short，full 和 fuller 选项。展示的信息格式基本一致，相近程度不一样

使用format，可以定制记录的格式。
当 oneline 或 format 与另一个 log 选项 --graph 结合使用时尤其有用。 这个选项添加了一些 ASCII 字符串来形象地展示你的分支、合并历史
$ git log --pretty=format:"%h %s" --graph

除了定制输出格式的选项之外，git log 还有许多非常实用的限制输出长度的选项，也就是只输出一部分的提交
类似 --since 和 --until 这种按照时间作限制的选项
$ git log --since=2.weeks ---列出最近两周的所有提交
该命令可用的格式十分丰富——可以是类似 "2008-01-15" 的具体的某一天，也可以是类似 "2 years 1 day 3 minutes ago" 的相对日期
还可以过滤出匹配指定条件的提交。 用 --author 选项显示指定作者的提交，用 --grep 选项搜索提交说明中的关键字

另一个非常有用的过滤器是 -S（俗称“pickaxe”选项，取“用鹤嘴锄在土里捡石头”之意）， 它接受一个字符串参数，并且只会显示那些添加或删除了该字符串的提交
$ git log -S function_name ---你想要找出添加或删除了对某一个特定函数的引用的提交
最后一个很实用的 git log 选项是路径（path）， 如果只关心某些文件或者目录的历史提交，可以在 git log 选项的最后指定它们的路径
因为是放在最后位置上的选项，所以用两个短划线（--）隔开之前的选项和后面限定的路径名


撤销操作
以运行带有 --amend 选项的提交命令来重新提交：
$ git commit --amend

取消暂存文件
在 “Changes to be committed” 文字正下方，提示使用 git reset HEAD <file>…​ 来取消暂存
$ git reset HEAD CONTRIBUTING.md ---用于取消暂存CONTRIBUTING.md 文件


查看远程仓库：$ git remote
可以指定选项 -v，会显示需要读写远程仓库使用的 Git 保存的简写与其对应的 URL

添加远程仓库：$ git remote add <shortname> <url> ---添加一个新的远程 Git 仓库，同时指定一个方便使用的简写
$ git fetch pb ---想拉取远程的仓库中有，但你没有的信息，可以运行 git fetch pb

从远程仓库中抓取与拉取：
$ git fetch <remote> ---这个命令会访问远程仓库，从中拉取所有你还没有的数据
执行完成后，你将会拥有那个远程仓库中所有分支的引用，可以随时合并或查看
必须注意 git fetch 命令只会将数据下载到你的本地仓库——它并不会自动合并或修改你当前的工作

推送到远程仓库：
$ git push <remote> <branch>
将 branch 分支推送到 remote 服务器时， 那么运行这个命令就可以将你所做的备份到服务器

查看某个远程仓库：
$ git remote show <remote>
会列出远程仓库的 URL 与跟踪分支的信息

远程仓库的重命名：
$ git remote rename <fetch> <remote> ---修改一个远程仓库的简写名

远程仓库的移除：
$ git remote remove <remote> / git remote rm <remote> ---移除一个远程仓库
使用这种方式删除了一个远程仓库，那么所有和这个远程仓库相关的远程跟踪分支以及配置信息也会一起被删除


打标签
$ git tag ---列出标签，可带上可选的-l选项，--list

创建标签：
git支持两种标签：
轻量标签lightweight ---像一个不会改变的分支，只是某个特定提交的引用
附注标签annotated ---存储在git数据库中的一个完整对象

附注标签：
$ git tag -a tagname（可以替换） -m "content(可替换的内容)"
-m 选项指定了一条将会存储在标签中的信息

查看标签信息和与之对应的提交信息：$ git show

轻量标签：
$ git tag tagname ---本质上是将提交校验和存储到一个文件中——没有保存任何其他信息
不需要使用 -a、-s 或 -m 选项，只需要提供标签名字

后期打标签：
$ git log --perrty=oneline ---先查看提交历史
$ git tag -a tagname content(指定提交的校验和,或部分校验和)

共享标签：
$ git push origin <tagname> ---在创建完标签后你必须显式地推送标签到共享服务器上
默认情况下，git push 命令并不会传送标签到远程仓库服务器上
也可以使用带有 --tags 选项的 git push 命令,将会把所有不在远程仓库服务器上的标签全部传送到那里
$ git push origin --tags
git push <remote> --tags 推送标签并不会区分轻量标签和附注标签， 没有简单的选项能够让你只选择推送一种标签

删除标签：
$ git tag -d <tagname>
注意上述命令并不会从任何远程仓库中移除这个标签，你必须用 git push <remote> :refs/tags/<tagname> 来更新你的远程仓库
第一种变体是 
$ git push <remote> :refs/tags/<tagname> ---将冒号前面的空值推送到远程标签名，从而高效地删除它
第二种更直观的删除远程标签的方式是 
$ git push origin --delete <tagname>

检出标签：
$ git checkout <tagname> ---查看某个标签所指向的文件版本
这会使你的仓库处于“分离头指针（detached HEAD）”的状态，会有不好的副作用
在“分离头指针”状态下，如果你做了某些更改然后提交它们，标签不会发生变化， 但你的新提交将不属于任何分支，并且将无法访问，除非通过确切的提交哈希才能访问
如果你需要进行更改，比如你要修复旧版本中的错误，那么通常需要创建一个新分支
如果在这之后又进行了一次提交，version2 分支就会因为这个改动向前移动， 此时它就会和 v2.0.0 标签稍微有些不同


别名
可以通过git config为每个命令设置一个别名。
$ git config --global <namespace>
分支
$ git branch <branch> ---分支创建 ---会在当前所在的提交对象上创建一个指针
git branch 命令仅仅 创建 一个新分支，并不会自动切换到新分支中去
它是一个指针，指向当前所在的本地分支

$ git log --oneline --decorate ---以简单地使用 git log 命令查看各个分支当前所指的对象，提供这一功能的参数是 --decorate


$ git checkout <branch> ---分支切换,切换到一个已经存在的分支

$ git log --oneline --decorate --graph --all ---项目分叉历史

$ git checkout -b <newBranchName> ---创建新分支的同时切换过去

$ git commit -a -m 'content' ---创建一个新的分支指针

$ git merge <branchName> ---合并分支

$ git branch -d <branchName> ---删除分支

$ git mergetool ---使用图形化工具解决冲突

$ git branch ---会得到当前所有分支的一个列表
分支前的 * 字符：代表现在检出的那一个分支，即HEAD指针所指向的分支

$ git branch -V ---查看每一个分支的最后一次提交

$ git branch --merged ---查看哪些分支已经合并到当前分支
--merged 与 --no-merged 可以过滤这个列表中已经合并或尚未合并到当前分支的分支

$ git branch -D <branchName> ---强制删除某个未合并的分支

$ git ls-remote <remote> ---显示获取远程引用的完整列表

$ git remote show <remote> ---获得远程分支的更多信息

$ git fetch <remote> ---与给定的远程仓库同步数据
HTML-Hyper Text Markup Language，超文本标记语言
HTML元素，由开始标签-内容-闭合标签组成
<opening tag>content<closing tag>

<html>-定义html文档
<body>-定义文档的主题
<h1>-<h6>-定义标题，从一级到六级，1到6号标题与1到6号字体逆序对应，比如1号字体对应6号标题，2号字体对应5号标题。
<hr>-定义水平线，用于分隔内容
<!--...-->-定义注释
<br>-用于换行，插入单个折行（换行）

<b>-blod，粗体，通常使用<strong>替换
<i>-italic，斜体，通常使用<em>替换
<b> 与<i> 定义粗体或斜体文本
<strong> 或者 <em>意味着你要呈现的文本是重要的，所以要突出显示

HTML文本格式化标签
<b>-定义粗体文本
<em>-定义着重文字
<i>-定义斜体字
<small>-定义小号字
<strong>-定义加重语气
<sub>-定义下标字
<sup>-定义上标字
<ins>-定义插入字
<del>-定义删除字

HTML‘计算机输出’标签
<code>-定义计算机代码
<kbd>-定义键盘码
<samp>-定义计算机代码样本
<var>-定义变量
<pre>-定义预格式文本

HTML引文，引用，标签定义
<abbr>-定义缩写
<address>-定义地址
<bdo>-定义文字方向
<blockquote>-定义长的引用
<q>-定义短的引用
<cite>-定义引用、引证
<dfn>-定义一个定义项目

HTML超链接（链接）
<a href="url">链接文本</a>
href属性，指定链接目标的url
target，可选属性，指定链接如何在浏览器中打开，有_blank-在新标签或窗口中打开链接；_self-在当前标签或窗口中打开链接。
title，可选属性，提供链接的额外关系，鼠标悬停在链接上时显示为工具提示
rel，可选属性，指定与目标链接的关系

文本链接，将一段文本转化为可点击的链接
<a href="https://www.example.com">访问示例网站</a>
图像链接
<a href="https://www.example.com">
  <img src="example.jpg" alt="示例图片">
</a>
锚点链接，除了链接到其他网页外，您还可以在同一页面内创建内部链接，这称为锚点链接。要创建锚点链接，需要在目标位置使用 <a> 元素定义一个标记，并使用#符号引用该标记。
<a href="#section2">跳转到第二部分</a>
<!-- 在页面中的某个位置 -->
<a name="section2"></a>
下载链接，链接用于下载文件而不是导航到另一个网页，可以使用 download 属性
<a href="document.pdf" download>下载文档</a>

HTML链接-id属性
id属性用于创建一个html文档标签，书签不会以任何方式显示，即在html页面中是不显示的，对读者而言是隐藏的
在HTML文档中插入ID
<a id="tips">有用的提示部分</a>
在HTML文档中创建一个链接到"有用的提示部分(id="tips"）
<a href="#tips">访问有用的提示部分</a>
从另一个页面创建一个链接到"有用的提示部分(id="tips"）
<a href="https://www.runoob.com/html/html-links.html#tips">
访问有用的提示部分</a>

HTML的head元素
<head>-定义了文档的信息
<title>-定义了文档的标题
<base>-定义了页面标签的默认链接地址
<link>-定义了一个文档和外部资源之间的关系
<meta>-定义了HTML文档中的元数据
<script>-定义了客户端的脚本文件
<style>-定义了HTML文档的样式文件

HTML图像标签
<img>-定义图像
<map>-定义图像地图
<area>-定义图像地图中的可点击区域
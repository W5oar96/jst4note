
> 问题1
>
> java: Internal error in the mapping processor: java.lang。NullPointerException
>
> compiler中User-local build process VM options (overrides Shared options)
>
> 增加设置-Djps.track.ap.dependencies=false
>
> "-" 横杠不能缺失

---



> 问题2
>
> java:Compilation failed: internal java compiler error
>
> 内存占满 关闭应用
>
> jvm分配的堆栈内存不足 调整分配的堆大小 默认为700
>
> compiler里 Build process heap size(Mbytes): 改为1024

---

问题3
git 报错
error: RPC failed; curl 35 OpenSSL SSL_read: SSL_ERROR_SYSCALL, errno 0
fatal: expected flush after ref listing
错误信息 "fatal: expected flush after ref listing" 通常与git在克隆或拉取仓库时遇到的SSL验证问题有关
解决方法是全局禁用Git的SSL验证，忽略SSL证书错误，从而避免错误
$ git config --global http.sslverify false 
# Ada

用于下载Gitlab CI产生的artifacts。

## 背景

Gitlab CI产生的artifacts并没有一个统一的文件目录存放，需要按一些规则去取：

- 首先根据commit id取到本次构建的pipeline信息
- 根据pipeline id取到jobs信息
- 根据job id拼接下载地址，取到artifacts文件

本库对这个过程做了封装。

## CLI使用

全局安装

```sh
npm install -g @futu/ada
```

使用

```sh
ada -g http://gitlab.com -p 12 -t X-XXXXXXXXXXXX -c ee9e4ad637b13e729e0d90c09a9b0990 -o dist.zip
```

## API使用

```javascript
const Ada = require('@futu/ada');
const ada = new Ada('http://gitlab.com', 12, 'X-XXXXXXXXXXXX');

ada.download('ee9e4ad637b13e729e0d90c09a9b0990', './dist.zip');
```

## 参数说明：

- `gitlab`/`g` Gitlab http(s)访问地址
- `project`/`p` 项目id，数字
- `stage` / `s`  取artifacts文件的Stage name，默认为第一个stage
- `token`/`t` Gitlab private token，在个人设置中可以生成
- `commit`/`c` Commit Id
- `output`/`o` 输出文件，在CLI模式中，默认为当前目录下的`artifacts.zip`
- `apiver`/`a` API版本，默认为`4`，适用于Gitlab 12，如果使用Gitlab 10，请将值设置为`3`

## 版本

### 2.1.1（2020-03-02）

- 修复当多个success状态的job存在时，取不到最新job的问题

### 2.1.0（2020-01-17）

- 支持传递stage参数，选择特定的stage来下载artifacts文件

### 2.0.0（2019-08-19）

- 添加`apiver`参数，支持v4 api

### 1.0.0 (2018-07-03)

- 基本功能完成

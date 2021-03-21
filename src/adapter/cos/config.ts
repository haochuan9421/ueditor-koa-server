const urlPrefix = "//ueditor-1302968899.cos.ap-guangzhou.myqcloud.com/";

const editorConfig: EditorConfig = {
  /* 上传图片配置项 */
  imageActionName: "uploadimage" /* 执行上传图片的action名称 */,
  imageFieldName: "upfile" /* 提交的图片表单名称 */,
  imageMaxSize: 50 * 1024 * 1024 /* 上传大小限制，50MB */,
  imageAllowFiles: [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".webp",
  ] /* 上传图片格式显示 */,
  imageCompressEnable: true /* 是否压缩图片,默认是true */,
  imageCompressBorder: 1600 /* 图片压缩最长边限制 */,
  imageInsertAlign: "none" /* 插入的图片浮动方式 */,
  imageUrlPrefix: urlPrefix /* 图片访问路径前缀 */,
  imagePathFormat:
    "storage/image/{yyyy}{mm}{dd}/{time}" /* 上传保存路径,可以自定义保存路径和文件名格式 */,
  /* {filename} 会替换成原文件名,配置这项需要注意中文乱码问题 */
  /* {rand:6} 会替换成随机数,后面的数字是随机数的位数 */
  /* {time} 会替换成时间戳 */
  /* {yyyy} 会替换成四位年份 */
  /* {yy} 会替换成两位年份 */
  /* {mm} 会替换成两位月份 */
  /* {dd} 会替换成两位日期 */
  /* {hh} 会替换成两位小时 */
  /* {ii} 会替换成两位分钟 */
  /* {ss} 会替换成两位秒 */
  /* 非法字符 \ : * ? " < > | */
  /* 具请体看线上文档: fex.baidu.com/ueditor/#use-format_upload_filename */

  /* 涂鸦图片上传配置项 */
  scrawlActionName: "uploadscrawl" /* 执行上传涂鸦的action名称 */,
  scrawlFieldName: "upfile" /* 提交的图片表单名称 */,
  scrawlPathFormat:
    "storage/image/{yyyy}{mm}{dd}/{time}" /* 上传保存路径,可以自定义保存路径和文件名格式 */,
  scrawlMaxSize: 50 * 1024 * 1024 /* 上传大小限制，50MB */,
  scrawlUrlPrefix: urlPrefix /* 图片访问路径前缀 */,
  scrawlInsertAlign: "none",

  /* 截图工具上传 */
  snapscreenActionName: "uploadimage" /* 执行上传截图的action名称 */,
  snapscreenPathFormat:
    "storage/image/{yyyy}{mm}{dd}/{time}" /* 上传保存路径,可以自定义保存路径和文件名格式 */,
  snapscreenUrlPrefix: urlPrefix /* 图片访问路径前缀 */,
  snapscreenInsertAlign: "none" /* 插入的图片浮动方式 */,

  /* 抓取远程图片配置 */
  catcherLocalDomain: ["127.0.0.1", "localhost", "img.baidu.com"],
  catcherActionName: "catchimage" /* 执行抓取远程图片的action名称 */,
  catcherFieldName: "source" /* 提交的图片列表表单名称 */,
  catcherPathFormat:
    "storage/image/{yyyy}{mm}{dd}/{time}" /* 上传保存路径,可以自定义保存路径和文件名格式 */,
  catcherUrlPrefix: urlPrefix /* 图片访问路径前缀 */,
  catcherMaxSize: 50 * 1024 * 1024 /* 上传大小限制，50MB */,
  catcherAllowFiles: [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
  ] /* 抓取图片格式显示 */,

  /* 上传视频配置 */
  videoActionName: "uploadvideo" /* 执行上传视频的action名称 */,
  videoFieldName: "upfile" /* 提交的视频表单名称 */,
  videoPathFormat:
    "storage/video/{yyyy}{mm}{dd}/{time}" /* 上传保存路径,可以自定义保存路径和文件名格式 */,
  videoUrlPrefix: urlPrefix /* 视频访问路径前缀 */,
  videoMaxSize: 200 * 1024 * 1024 /* 上传大小限制，200MB */,
  videoAllowFiles: [
    ".flv",
    ".swf",
    ".mkv",
    ".avi",
    ".rm",
    ".rmvb",
    ".mpeg",
    ".mpg",
    ".ogg",
    ".ogv",
    ".mov",
    ".wmv",
    ".mp4",
    ".webm",
    ".mp3",
    ".wav",
    ".mid",
  ] /* 上传视频格式显示 */,

  /* 上传文件配置 */
  fileActionName: "uploadfile" /* controller里,执行上传视频的action名称 */,
  fileFieldName: "upfile" /* 提交的文件表单名称 */,
  filePathFormat:
    "storage/file/{yyyy}{mm}{dd}/{time}" /* 上传保存路径,可以自定义保存路径和文件名格式 */,
  fileUrlPrefix: urlPrefix /* 文件访问路径前缀 */,
  fileMaxSize: 200 * 1024 * 1024 /* 上传大小限制，200MB */,
  fileAllowFiles: [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".flv",
    ".swf",
    ".mkv",
    ".avi",
    ".rm",
    ".rmvb",
    ".mpeg",
    ".mpg",
    ".ogg",
    ".ogv",
    ".mov",
    ".wmv",
    ".mp4",
    ".webm",
    ".mp3",
    ".wav",
    ".mid",
    ".rar",
    ".zip",
    ".tar",
    ".gz",
    ".7z",
    ".bz2",
    ".cab",
    ".iso",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".pdf",
    ".txt",
    ".md",
    ".xml",
  ] /* 上传文件格式显示 */,

  /* 列出指定目录下的图片 */
  imageManagerActionName: "listimage" /* 执行图片管理的action名称 */,
  imageManagerListPath: "storage/image/" /* 指定要列出图片的目录 */,
  imageManagerListSize: 20 /* 每次列出文件数量 */,
  imageManagerUrlPrefix: urlPrefix /* 图片访问路径前缀 */,
  imageManagerInsertAlign: "none" /* 插入的图片浮动方式 */,
  imageManagerAllowFiles: [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
  ] /* 列出的文件类型 */,

  /* 列出指定目录下的文件 */
  fileManagerActionName: "listfile" /* 执行文件管理的action名称 */,
  fileManagerListPath: "storage/file/" /* 指定要列出文件的目录 */,
  fileManagerUrlPrefix: urlPrefix /* 文件访问路径前缀 */,
  fileManagerListSize: 20 /* 每次列出文件数量 */,
  fileManagerAllowFiles: [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".flv",
    ".swf",
    ".mkv",
    ".avi",
    ".rm",
    ".rmvb",
    ".mpeg",
    ".mpg",
    ".ogg",
    ".ogv",
    ".mov",
    ".wmv",
    ".mp4",
    ".webm",
    ".mp3",
    ".wav",
    ".mid",
    ".rar",
    ".zip",
    ".tar",
    ".gz",
    ".7z",
    ".bz2",
    ".cab",
    ".iso",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".pdf",
    ".txt",
    ".md",
    ".xml",
  ] /* 列出的文件类型 */,
};

export default editorConfig;
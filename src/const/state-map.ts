// 上传状态映射表，国际化用户需考虑此处数据的国际化
enum stateMap {
  SUCCESS = "SUCCESS", // 上传成功标记，在UEditor中内不可改变，否则 flash 判断会出错
  ERROR_TMP_FILE = "临时文件错误",
  ERROR_TMP_FILE_NOT_FOUND = "找不到临时文件",
  ERROR_SIZE_EXCEED = "文件大小超出网站限制",
  ERROR_TYPE_NOT_ALLOWED = "文件类型不允许",
  ERROR_CREATE_DIR = "目录创建失败",
  ERROR_DIR_NOT_WRITEABLE = "目录没有写权限",
  ERROR_FILE_MOVE = "文件保存时出错",
  ERROR_FILE_NOT_FOUND = "找不到上传文件",
  ERROR_WRITE_CONTENT = "写入文件内容错误",
  ERROR_UNKNOWN = "未知错误",
  ERROR_DEAD_LINK = "链接不可用",
  ERROR_HTTP_LINK = "链接不是http链接",
  ERROR_HTTP_CONTENTTYPE = "链接contentType不正确",
  INVALID_URL = "非法 URL",
  INVALID_IP = "非法 IP",
}

export default stateMap;

package com.vietnl.hwin.common.exception;

/**
 * Mã lỗi + câu thông báo (tiếng Việt). Mỗi module có enum {@code ExceptionMessage} riêng implements interface này;
 * lỗi dùng chung nằm ở {@link CommonErrorMessage}.
 * Câu thông báo có thể chứa placeholder dạng {@code #key#}, thay bằng dữ liệu truyền vào {@link ResponseException}.
 */
public interface BaseErrorMessage {

    /** Câu thông báo. */
    String val();

    /** Mã lỗi ổn định cho frontend (tên hằng enum). */
    String name();
}

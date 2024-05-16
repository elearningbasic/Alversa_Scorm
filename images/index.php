<?php
    error_reporting(E_ALL | E_STRICT);
    require("../../../../runtime/authoring/1-0/php/uploader/uploadHandler.php");
    $upload_handler = new UploadHandler(array(
        'image_versions' => array(), // no thumbnails on server,
        'upload_dir' => dirname(__FILE__) . '/'
    ));
?>
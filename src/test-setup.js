/* React に「ここはテスト環境」と伝える。これが無いと act(...) が警告を出す */
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

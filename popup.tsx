import React from "react";

const Popup = () => {
  return (
    <div className="w-80 p-4 text-center">
      <h2 className="text-lg font-semibold mb-2">Furlg</h2>
      <p className="text-gray-600 mb-4">请打开新标签页使用Furlg搜索功能</p>
      <button
        onClick={() => chrome.tabs.create({ url: 'chrome://newtab/' })}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        打开新标签页
      </button>
    </div>
  );
};

export default Popup;

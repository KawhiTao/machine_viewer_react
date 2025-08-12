import React, { useState, useRef, useCallback, useMemo } from "react";

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  className?: string;
}

function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  onScroll,
  className = "",
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 计算可见区域的项目索引范围
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan,
    );
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // 计算总高度
  const totalHeight = items.length * itemHeight;

  // 计算可见项目
  const visibleItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      if (items[i]) {
        result.push({
          item: items[i],
          index: i,
          top: i * itemHeight,
        });
      }
    }
    return result;
  }, [items, visibleRange, itemHeight]);

  // 处理滚动事件
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    },
    [onScroll],
  );

  // 滚动到指定索引
  const scrollToIndex = useCallback(
    (index: number) => {
      if (containerRef.current) {
        const scrollTop = index * itemHeight;
        containerRef.current.scrollTop = scrollTop;
        setScrollTop(scrollTop);
      }
    },
    [itemHeight],
  );

  // 滚动到顶部
  // const scrollToTop = useCallback(() => {
  //   scrollToIndex(0);
  // }, [scrollToIndex]);

  // 滚动到底部
  // const scrollToBottom = useCallback(() => {
  //   scrollToIndex(items.length - 1);
  // }, [scrollToIndex, items.length]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {visibleItems.map(({ item, index, top }) => (
          <div
            key={index}
            style={{
              position: "absolute",
              top,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// 网格虚拟化组件
interface VirtualizedGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  gap?: number;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  className?: string;
}

function VirtualizedGrid<T>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  renderItem,
  gap = 16,
  overscan = 5,
  onScroll,
  className = "",
}: VirtualizedGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 计算每行的列数
  const columnsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const totalRows = Math.ceil(items.length / columnsPerRow);
  const rowHeight = itemHeight + gap;

  // 计算可见区域的行索引范围
  const visibleRange = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endRow = Math.min(
      totalRows - 1,
      Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan,
    );
    return { startRow, endRow };
  }, [scrollTop, rowHeight, containerHeight, totalRows, overscan]);

  // 计算总高度
  const totalHeight = totalRows * rowHeight;

  // 计算可见项目
  const visibleItems = useMemo(() => {
    const result = [];
    for (let row = visibleRange.startRow; row <= visibleRange.endRow; row++) {
      for (let col = 0; col < columnsPerRow; col++) {
        const index = row * columnsPerRow + col;
        if (index < items.length) {
          result.push({
            item: items[index],
            index,
            top: row * rowHeight,
            left: col * (itemWidth + gap),
          });
        }
      }
    }
    return result;
  }, [items, visibleRange, columnsPerRow, rowHeight, itemWidth, gap]);

  // 处理滚动事件
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    },
    [onScroll],
  );

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {visibleItems.map(({ item, index, top, left }) => (
          <div
            key={index}
            style={{
              position: "absolute",
              top,
              left,
              width: itemWidth,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// 自适应虚拟化组件
interface AutoVirtualizedListProps<T> {
  items: T[];
  estimatedItemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  className?: string;
}

function AutoVirtualizedList<T>({
  items,
  estimatedItemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  onScroll,
  className = "",
}: AutoVirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [itemHeights, setItemHeights] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // 获取或估算项目高度
  const getItemHeight = useCallback(
    (index: number) => {
      return itemHeights[index] || estimatedItemHeight;
    },
    [itemHeights, estimatedItemHeight],
  );

  // 计算项目的累积偏移
  const getItemOffset = useCallback(
    (index: number) => {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += getItemHeight(i);
      }
      return offset;
    },
    [getItemHeight],
  );

  // 计算总高度
  const totalHeight = useMemo(() => {
    return items.reduce((total, _, index) => total + getItemHeight(index), 0);
  }, [items, getItemHeight]);

  // 计算可见项目索引范围
  const visibleRange = useMemo(() => {
    let startIndex = 0;
    let currentOffset = 0;

    // 找到第一个可见项目
    while (startIndex < items.length && currentOffset < scrollTop) {
      currentOffset += getItemHeight(startIndex);
      startIndex++;
    }
    startIndex = Math.max(0, startIndex - overscan);

    // 找到最后一个可见项目
    let endIndex = startIndex;
    currentOffset = getItemOffset(startIndex);
    while (
      endIndex < items.length &&
      currentOffset < scrollTop + containerHeight
    ) {
      currentOffset += getItemHeight(endIndex);
      endIndex++;
    }
    endIndex = Math.min(items.length - 1, endIndex + overscan);

    return { startIndex, endIndex };
  }, [
    scrollTop,
    containerHeight,
    items.length,
    overscan,
    getItemHeight,
    getItemOffset,
  ]);

  // 处理滚动事件
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    },
    [onScroll],
  );

  // 测量项目高度
  const measureItemHeight = useCallback(
    (index: number, element: HTMLDivElement) => {
      if (element) {
        const height = element.getBoundingClientRect().height;
        setItemHeights((prev) => {
          const newHeights = [...prev];
          newHeights[index] = height;
          return newHeights;
        });
      }
    },
    [],
  );

  // 项目引用回调
  const itemRefCallback = useCallback(
    (index: number) => (element: HTMLDivElement | null) => {
      if (element) {
        itemRefs.current.set(index, element);
        measureItemHeight(index, element);
      } else {
        itemRefs.current.delete(index);
      }
    },
    [measureItemHeight],
  );

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {Array.from(
          { length: visibleRange.endIndex - visibleRange.startIndex + 1 },
          (_, i) => {
            const index = visibleRange.startIndex + i;
            const top = getItemOffset(index);

            return (
              <div
                key={index}
                ref={itemRefCallback(index)}
                style={{
                  position: "absolute",
                  top,
                  left: 0,
                  right: 0,
                  minHeight: estimatedItemHeight,
                }}
              >
                {renderItem(items[index], index)}
              </div>
            );
          },
        )}
      </div>
    </div>
  );
}

export default VirtualizedList;
export { VirtualizedGrid, AutoVirtualizedList };
export type {
  VirtualizedListProps,
  VirtualizedGridProps,
  AutoVirtualizedListProps,
};

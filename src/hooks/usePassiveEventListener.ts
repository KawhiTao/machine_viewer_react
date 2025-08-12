import { useEffect, useRef } from "react";

type EventHandler<T = Event> = (event: T) => void;

interface UsePassiveEventListenerOptions {
  passive?: boolean;
  capture?: boolean;
  once?: boolean;
}

/**
 * 用于添加被动事件监听器的自定义Hook，优化滚轮等事件性能
 * @param eventType 事件类型
 * @param handler 事件处理函数
 * @param element 目标元素，默认为document
 * @param options 事件监听器选项
 */
export function usePassiveEventListener<T extends Event = Event>(
  eventType: string,
  handler: EventHandler<T>,
  element?: HTMLElement | Document | Window | null,
  options: UsePassiveEventListenerOptions = {},
) {
  const savedHandler = useRef<EventHandler<T>>(handler);
  const { passive = true, capture = false, once = false } = options;

  // 保存最新的处理函数
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement = element ?? document;

    if (!targetElement?.addEventListener) return;

    // 创建包装的事件处理函数
    const eventListener = (event: Event) => {
      savedHandler.current?.(event as T);
    };

    const eventOptions = {
      passive,
      capture,
      once,
    };

    // 添加事件监听器
    targetElement.addEventListener(eventType, eventListener, eventOptions);

    // 清理函数
    return () => {
      targetElement.removeEventListener(eventType, eventListener, eventOptions);
    };
  }, [eventType, element, passive, capture, once]);
}

/**
 * 专门用于滚轮事件的Hook，自动设置为passive模式
 */
export function usePassiveWheelListener(
  handler: EventHandler<WheelEvent>,
  element?: HTMLElement | Document | Window | null,
) {
  return usePassiveEventListener("wheel", handler, element, {
    passive: true,
  });
}

/**
 * 专门用于触摸移动事件的Hook，自动设置为passive模式
 */
export function usePassiveTouchMoveListener(
  handler: EventHandler<TouchEvent>,
  element?: HTMLElement | Document | Window | null,
) {
  return usePassiveEventListener("touchmove", handler, element, {
    passive: true,
  });
}

/**
 * 组合Hook，同时处理滚轮和触摸移动事件
 */
export function usePassiveScrollOptimization(
  wheelHandler?: EventHandler<WheelEvent>,
  touchHandler?: EventHandler<TouchEvent>,
  element?: HTMLElement | Document | Window | null,
) {
  usePassiveWheelListener(wheelHandler ?? (() => {}), element);

  usePassiveTouchMoveListener(touchHandler ?? (() => {}), element);
}

export default usePassiveEventListener;

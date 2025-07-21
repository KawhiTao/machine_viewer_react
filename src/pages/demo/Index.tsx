import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  useRef,
  useContext,
  useReducer,
  useImperativeHandle,
  useDebugValue,
  useId,
  useSyncExternalStore,
  useTransition,
  useDeferredValue,
  useInsertionEffect,
  // forwardRef,
  createContext,
  // useNavigate,
} from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// Context 用法
const MyContext = createContext("默认值");

// 自定义输入框组件，演示 useImperativeHandle
function MyInput(props: { ref?: React.Ref<{ focus: () => void }> }) {
  const inputRef = useRef<HTMLInputElement>(null);

  // 暴露 focus 方法给父组件
  useImperativeHandle(props.ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  return <input ref={inputRef} placeholder="点击下方按钮自动聚焦" />;
}

function App() {
  // useState
  const [count, setCount] = useState(0);

  // useEffect
  useEffect(() => {
    console.log("副作用：count变化时执行");
    return () => {
      console.log("清理副作用");
    };
  }, [count]);

  // useLayoutEffect
  useLayoutEffect(() => {
    console.log("布局副作用：DOM更新后执行");
  }, [count]);

  // useMemo
  const double = useMemo(() => {
    console.log("useMemo 计算");
    return count * 2;
  }, [count]);

  // useCallback
  const increment = useCallback(() => setCount((c) => c + 1), []);

  // useRef
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  // useContext
  const contextValue = useContext(MyContext);

  useEffect(() => {
    inputRef.current?.focus();
  }, [contextValue]);
  // useReducer
  const reducer = (state: number, action: { type: "add" | "sub" }) =>
    action.type === "add" ? state + 1 : state - 1;
  const [state, dispatch] = useReducer(reducer, 0);

  // useImperativeHandle
  const myInputRef = useRef<{ focus: () => void }>(null);

  // useDebugValue
  useDebugValue(count > 5 ? "大于5" : "小于等于5");

  // useId
  const id = useId();

  // useSyncExternalStore
  // 简单演示：每次 count 变化时 snapshot 也变化
  const store = {
    subscribe: (cb: () => void) => {
      // 这里没有真正的外部 store，仅演示
      return () => {};
    },
    getSnapshot: () => count,
  };
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);

  // useTransition
  const [isPending, startTransition] = useTransition();

  // useNavigate - 必须在组件顶层调用
  const navigate = useNavigate();

  const handleTransition = () => {
    startTransition(() => {
      setCount((c) => c + 1);
    });

    // 演示 useTransition 后可以进行路由跳转
    // navigate("/new-route");
  };

  // useDeferredValue
  const deferredCount = useDeferredValue(count);

  // useInsertionEffect
  useInsertionEffect(() => {
    // 这里仅演示，实际可用于样式插入
    console.log("useInsertionEffect 执行");
  }, []);

  return (
    <MyContext.Provider value="Hello Context">
      <div style={{ padding: 24 }}>
        <h2>React 常用 Hooks 演示</h2>
        <p>useState: {count}</p>
        <Button onClick={() => setCount(count + 1)}>useState 加一</Button>
        <hr />
        <p>useEffect: 副作用已在控制台打印</p>
        <p>useLayoutEffect: 布局副作用已在控制台打印</p>
        <hr />
        <p>useMemo: double = {double}</p>
        <hr />
        <Button onClick={increment}>useCallback 加一</Button>
        <hr />
        <input ref={inputRef} placeholder="useRef 输入框" />
        <Button onClick={focusInput}>useRef 聚焦</Button>
        <hr />
        <p>useContext: {contextValue}</p>
        <hr />
        <p>useReducer: {state}</p>
        <Button onClick={() => dispatch({ type: "add" })}>
          useReducer 加一
        </Button>
        <Button onClick={() => dispatch({ type: "sub" })}>
          useReducer 减一
        </Button>
        <hr />
        <MyInput ref={myInputRef} />
        <Button onClick={() => myInputRef.current?.focus()}>
          useImperativeHandle 聚焦
        </Button>
        <hr />
        <p>useDebugValue: 请在 React DevTools 查看</p>
        <hr />
        <p>useId: {id}</p>
        <hr />
        <p>useSyncExternalStore: {snapshot}</p>
        <hr />
        <Button onClick={handleTransition}>useTransition 并发加一</Button>
        <p>isPending: {isPending ? "等待中" : "已完成"}</p>
        <hr />
        <p>useDeferredValue: {deferredCount}</p>
        <hr />
        <p>useInsertionEffect: 请看控制台</p>
      </div>
    </MyContext.Provider>
  );
}

export default App;

import { useEffect, useCallback, useState, useRef } from "react";

export function useIntersectionObserver() {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<any>(null);
  const [_,updater] = useState(0);

  const callBack = useCallback((node:any)=>{
    if(node){
      ref.current = node
      updater((x) => x + 1)
    }
  },[])


  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        setIsIntersecting(entry?.isIntersecting ?? false);
      });
    });
    
  
    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [_]);

  return {
    ref:callBack,
    visible: isIntersecting,
  };
}
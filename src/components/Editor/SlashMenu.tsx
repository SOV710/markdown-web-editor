import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
} from "react";
import type { SlashCommandItem } from "@/extensions/slash-command";
import styles from "./SlashMenu.module.css";

export interface SlashMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface SlashMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index];
        if (item) {
          command(item);
        }
      },
      [items, command]
    );

    const upHandler = useCallback(() => {
      setSelectedIndex((prevIndex) =>
        prevIndex <= 0 ? items.length - 1 : prevIndex - 1
      );
    }, [items.length]);

    const downHandler = useCallback(() => {
      setSelectedIndex((prevIndex) =>
        prevIndex >= items.length - 1 ? 0 : prevIndex + 1
      );
    }, [items.length]);

    const enterHandler = useCallback(() => {
      selectItem(selectedIndex);
    }, [selectItem, selectedIndex]);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          upHandler();
          return true;
        }

        if (event.key === "ArrowDown") {
          downHandler();
          return true;
        }

        if (event.key === "Enter") {
          enterHandler();
          return true;
        }

        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className={styles.container}>
          <div className={styles.empty}>No results</div>
        </div>
      );
    }

    return (
      <div className={styles.container}>
        {items.map((item, index) => (
          <button
            key={item.title}
            type="button"
            className={styles.item}
            data-selected={index === selectedIndex}
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <span className={styles.icon}>{item.icon}</span>
            <div className={styles.content}>
              <span className={styles.title}>{item.title}</span>
              <span className={styles.description}>{item.description}</span>
            </div>
          </button>
        ))}
      </div>
    );
  }
);

SlashMenu.displayName = "SlashMenu";

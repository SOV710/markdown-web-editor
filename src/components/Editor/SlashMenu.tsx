import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { SlashCommandItem, SlashCommandGroup } from "@/extensions/slash-command";
import styles from "./SlashMenu.module.css";

export interface SlashMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface SlashMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

const GROUP_LABELS: Record<SlashCommandGroup, string> = {
  text: "Text",
  list: "Lists",
  block: "Blocks",
  media: "Media",
  advanced: "Advanced",
};

const GROUP_ORDER: SlashCommandGroup[] = ["text", "list", "block", "media", "advanced"];

export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Group items while preserving order
    const groupedItems = useMemo(() => {
      const groups: { group: SlashCommandGroup; items: SlashCommandItem[] }[] = [];
      const seenGroups = new Set<SlashCommandGroup>();

      for (const item of items) {
        if (!seenGroups.has(item.group)) {
          seenGroups.add(item.group);
          groups.push({ group: item.group, items: [] });
        }
        const groupEntry = groups.find((g) => g.group === item.group);
        groupEntry?.items.push(item);
      }

      // Sort groups by predefined order
      groups.sort(
        (a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group)
      );

      return groups;
    }, [items]);

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

    // Create a flat index map for keyboard navigation
    let flatIndex = 0;

    return (
      <div className={styles.container}>
        {groupedItems.map((group, groupIndex) => (
          <div key={group.group}>
            {groupIndex > 0 && <div className={styles.groupDivider} />}
            <div className={styles.groupHeader}>{GROUP_LABELS[group.group]}</div>
            {group.items.map((item) => {
              const currentIndex = flatIndex++;
              return (
                <button
                  key={item.title}
                  type="button"
                  className={styles.item}
                  data-selected={currentIndex === selectedIndex}
                  onClick={() => selectItem(currentIndex)}
                  onMouseEnter={() => setSelectedIndex(currentIndex)}
                >
                  <span className={styles.icon}>{item.icon}</span>
                  <div className={styles.content}>
                    <span className={styles.title}>{item.title}</span>
                    <span className={styles.description}>{item.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  }
);

SlashMenu.displayName = "SlashMenu";

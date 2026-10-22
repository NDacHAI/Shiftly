import { useLayoutEffect, useRef } from 'react';

type Slot = { left: number; width: number };

// Last position per indicator, kept outside React so the slide also starts from the
// previous tab when a route change remounts the header.
const lastSlots: Record<string, Slot | undefined> = {};

function applySlot(indicator: HTMLElement, slot: Slot) {
    indicator.style.transform = `translateX(${slot.left}px)`;
    indicator.style.width = `${slot.width}px`;
}

function snapTo(indicator: HTMLElement, slot: Slot) {
    indicator.style.transition = 'none';
    applySlot(indicator, slot);
    // Force a style flush so re-enabling the transition does not animate this jump.
    void indicator.offsetWidth;
    indicator.style.transition = '';
}

function isSameSlot(left: Slot | undefined, right: Slot) {
    return left?.left === right.left && left.width === right.width;
}

// Moves an absolutely positioned indicator under the container's `[data-active="true"]`
// child. The CSS transition lives on the indicator; this only sets transform/width.
export function useSlidingIndicator<TContainer extends HTMLElement = HTMLElement>(
    name: string,
    activeKey: string,
) {
    const containerRef = useRef<TContainer>(null);
    const indicatorRef = useRef<HTMLSpanElement>(null);

    useLayoutEffect(() => {
        const container = containerRef.current;
        const indicator = indicatorRef.current;
        const active = container?.querySelector<HTMLElement>('[data-active="true"]');

        if (!container || !indicator) {
            return;
        }

        if (!active) {
            indicator.style.opacity = '0';
            return;
        }

        const measure = (): Slot => ({
            left: active.offsetLeft,
            width: active.offsetWidth,
        });
        const next = measure();
        const previous = lastSlots[name];

        indicator.style.opacity = '1';

        if (previous && !isSameSlot(previous, next)) {
            // Start from the old slot, then let the CSS transition carry it to the new one.
            snapTo(indicator, previous);
            applySlot(indicator, next);
        } else {
            snapTo(indicator, next);
        }

        lastSlots[name] = next;

        // Late web-font loads and language switches change label widths: snap, don't slide.
        // The observer also fires once on observe(); the equality check skips that call.
        const observer = new ResizeObserver(() => {
            const slot = measure();

            if (isSameSlot(lastSlots[name], slot)) return;

            snapTo(indicator, slot);
            lastSlots[name] = slot;
        });

        observer.observe(active);

        return () => observer.disconnect();
    }, [name, activeKey]);

    return { containerRef, indicatorRef };
}

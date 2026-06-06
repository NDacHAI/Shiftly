import { type MouseEvent, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBriefcase,
    faBuilding,
    faCalendarDays,
    faChartColumn,
    faClock,
    faFileLines,
    faGear,
    faUsers,
    type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

const navigation: Array<{
    label: string;
    icon: IconDefinition;
    href: string;
}> = [
    { label: 'Dashboard', icon: faChartColumn, href: '#' },
    { label: 'Departments', icon: faBuilding, href: '/departments' },
    { label: 'Positions', icon: faBriefcase, href: '#' },
    { label: 'Employees', icon: faUsers, href: '#' },
    { label: 'Work Shifts', icon: faCalendarDays, href: '#' },
    { label: 'Attendance', icon: faClock, href: '#' },
    { label: 'Leave Requests', icon: faFileLines, href: '#' },
    { label: 'Settings', icon: faGear, href: '#' },
];

type NavProps = {
    defaultActiveItem?: string;
};

export function Nav({ defaultActiveItem = 'Dashboard' }: NavProps) {
    const [activeItem, setActiveItem] = useState(defaultActiveItem);

    function handleNavigation(
        event: MouseEvent<HTMLAnchorElement>,
        label: string,
        href: string,
    ) {
        setActiveItem(label);

        if (href === '#') {
            event.preventDefault();
        }
    }

    return (
        <aside className="sticky top-0 flex h-screen flex-col border-r border-[#e8e7ef] bg-white px-4 pt-6 pb-5 max-sm:static max-sm:h-auto max-sm:border-r-0 max-sm:border-b max-sm:py-3">
            <a className="flex items-center gap-2.5 px-2 pb-7 max-sm:pb-3" href="#">
                <span className="relative flex size-[22px] rotate-45 items-center justify-center rounded-[5px] bg-[#7047eb] after:size-[7px] after:rounded-sm after:bg-white after:content-['']" />
                <strong className="text-xl tracking-[-0.5px] text-slate-950">
                    Shiftly
                </strong>
            </a>

            <nav
                aria-label="Điều hướng chính"
                className="grid gap-1.5 max-sm:flex max-sm:overflow-x-auto max-sm:pb-1"
            >
                {navigation.map((item) => {
                    const isActive = activeItem === item.label;

                    return (
                        <a
                            aria-current={isActive ? 'page' : undefined}
                            className={`relative flex min-h-11 items-center gap-3.5 rounded-lg px-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                                isActive
                                    ? "bg-[#f2efff] text-[#6842e8] before:absolute before:-left-4 before:h-6 before:w-[3px] before:rounded-r before:bg-[#7047eb] max-sm:before:inset-x-3 max-sm:before:-bottom-1 max-sm:before:top-auto max-sm:before:h-[3px] max-sm:before:w-auto"
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            } max-sm:flex-none`}
                            href={item.href}
                            key={item.label}
                            onClick={(event) =>
                                handleNavigation(
                                    event,
                                    item.label,
                                    item.href,
                                )
                            }
                        >
                            <FontAwesomeIcon
                                className="w-[18px] shrink-0"
                                icon={item.icon}
                            />
                            <span>{item.label}</span>
                        </a>
                    );
                })}
            </nav>
        </aside>
    );
}

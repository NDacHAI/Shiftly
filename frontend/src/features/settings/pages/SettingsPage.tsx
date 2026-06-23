import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faGlobe, faLanguage } from '@fortawesome/free-solid-svg-icons';
import { DropdownSelect } from '@/components/ui';
import { useI18n, type Language } from '@/i18n';

const languageOptions: Array<{
    value: Language;
    labelKey: 'settings.english' | 'settings.vietnamese';
    badge: string;
}> = [
        { value: 'en', labelKey: 'settings.english', badge: 'EN' },
        { value: 'vi', labelKey: 'settings.vietnamese', badge: 'VI' },
    ];

export function SettingsPage() {
    const { language, setLanguage, t } = useI18n();

    return (
        <section className="mx-auto grid max-w-[1440px] gap-5 p-6 max-sm:p-4">
            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                    <FontAwesomeIcon icon={faGear} />
                </span>
                <div>
                    <h2 className="text-xl font-bold text-slate-950">
                        {t('settings.title')}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        {t('settings.subtitle')}
                    </p>
                </div>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-start gap-4 border-b border-slate-200 px-6 py-5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                        <FontAwesomeIcon icon={faLanguage} />
                    </span>
                    <div>
                        <h3 className="text-base font-bold text-slate-950">
                            {t('settings.languageTitle')}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            {t('settings.languageDescription')}
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 p-6">
                    <div className="grid max-w-sm gap-2">
                        <label className="text-sm font-semibold text-slate-700">
                            {t('settings.currentLanguage')}
                        </label>
                        <div className="dropdown-select-field">
                            <DropdownSelect
                                ariaLabel={t('settings.currentLanguage')}
                                options={languageOptions.map((option) => ({
                                    value: option.value,
                                    label: t(option.labelKey),
                                    icon: (
                                        <span className="text-primary-700">
                                            {option.badge}
                                        </span>
                                    ),
                                }))}
                                size="xs"
                                triggerIcon={<FontAwesomeIcon icon={faGlobe} />}
                                value={language}
                                onChange={setLanguage}
                            />
                        </div>
                    </div>
                </div>
            </section>
        </section>
    );
}

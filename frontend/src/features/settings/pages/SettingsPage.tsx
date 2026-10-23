import { useState } from 'react';
import { useToast } from '@/components/feedback';
import { PageHeader } from '@/components/ui';
import { UnsavedChangesBar } from '@/features/employees/components/detail/UnsavedChangesBar';
import { locales, useI18n, type Language } from '@/i18n';

// Each language is named in its own language, with the other one as a hint.
const languageOptions: Array<{ value: Language; code: string; name: string; alt: string }> = [
    { value: 'vi', code: 'VI', name: 'Tiếng Việt', alt: 'Vietnamese' },
    { value: 'en', code: 'EN', name: 'English', alt: 'Tiếng Anh' },
];

// Display preferences (frontend/ui/Shiftly Cai dat.html).
export function SettingsPage() {
    const { language, setLanguage, t } = useI18n();
    const { showToast } = useToast();
    const [picked, setPicked] = useState<Language>(language);
    const dirty = picked !== language;

    function save() {
        setLanguage(picked);
        // `t` still reads the old language here, so take the message from the new locale.
        showToast({ message: locales[picked].settings.saved, variant: 'success' });
    }

    return (
        <section className="mx-auto grid w-full max-w-[1100px] gap-6 px-8 pt-8 pb-32 text-ink max-sm:px-4">
            <PageHeader
                description={t('settings.subtitle')}
                eyebrow={t('settings.eyebrow')}
                title={t('settings.title')}
            />

            <section className="flex flex-wrap gap-x-12 gap-y-6 rounded-[14px] border border-rule bg-paper p-7 max-sm:p-5">
                <div className="flex flex-[0_0_240px] flex-col gap-1 max-sm:flex-auto">
                    <h2 className="text-[15px] font-semibold">{t('settings.languageTitle')}</h2>
                    <p className="text-[13px] leading-relaxed text-muted text-pretty">
                        {t('settings.languageDescription')}
                    </p>
                </div>

                <div
                    aria-label={t('settings.languageTitle')}
                    className="grid min-w-0 flex-[1_1_440px] grid-cols-[repeat(auto-fit,minmax(220px,1fr))] content-start gap-2.5"
                    role="radiogroup"
                >
                    {languageOptions.map((option) => {
                        const selected = option.value === picked;

                        return (
                            <button
                                aria-checked={selected}
                                className={`flex min-h-0 cursor-pointer items-center gap-3.5 rounded-xl border-[1.5px] p-4 text-left text-ink transition-colors hover:border-ink ${
                                    selected ? 'border-ink bg-white' : 'border-rule bg-transparent'
                                }`}
                                key={option.value}
                                lang={option.value}
                                role="radio"
                                type="button"
                                onClick={() => setPicked(option.value)}
                            >
                                <span
                                    className={`grid size-10 flex-none place-items-center rounded-[10px] text-[13px] font-medium tabular-nums transition-colors ${
                                        selected ? 'bg-ink text-sand' : 'bg-stone text-ink'
                                    }`}
                                >
                                    {option.code}
                                </span>
                                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                    <span className="text-[15px] font-semibold">{option.name}</span>
                                    <span className="text-xs text-muted">{option.alt}</span>
                                </span>
                                <span
                                    className={`grid size-5 flex-none place-items-center rounded-full border-[1.5px] transition-colors ${
                                        selected ? 'border-ink bg-ink' : 'border-[#b9b3a4] bg-transparent'
                                    }`}
                                >
                                    <span className={`size-2 rounded-full ${selected ? 'bg-sand' : 'bg-transparent'}`} />
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            {dirty && (
                <UnsavedChangesBar
                    discardLabel={t('settings.discard')}
                    message={t('settings.unsaved')}
                    saving={false}
                    onDiscard={() => setPicked(language)}
                    onSave={save}
                />
            )}
        </section>
    );
}

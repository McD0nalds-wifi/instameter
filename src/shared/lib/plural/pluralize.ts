export type PluralForms = {
  one: string;
  few: string;
  many: string;
  other: string;
};

const pluralRules = new Intl.PluralRules('ru-RU');

const isRussianCategory = (category: Intl.LDMLPluralRule): category is keyof PluralForms =>
  category === 'one' || category === 'few' || category === 'many' || category === 'other';

export const pluralize = (count: number, forms: PluralForms): string => {
  const category = pluralRules.select(count);
  return isRussianCategory(category) ? forms[category] : forms.other;
};

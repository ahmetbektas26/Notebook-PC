import type { NoteTemplate } from "../types";

export type TemplateDefinition = NoteTemplate & { builtIn: boolean };

const date = new Date(0).toISOString();

export const BUILT_IN_TEMPLATES: TemplateDefinition[] = [
  {
    id: "blank",
    name: "Boş not",
    description: "Sıfırdan başlamak için temiz bir sayfa.",
    scope: "personal",
    topic: "Genel",
    title: "Başlıksız not",
    content: "",
    tags: [],
    createdAt: date,
    builtIn: true
  },
  {
    id: "daily-journal",
    name: "Günlük",
    description: "Günün duygularını, olaylarını ve çıkarımlarını kaydet.",
    scope: "personal",
    topic: "Günlük",
    title: "Bugünün günlüğü",
    content:
      "# Bugün\n\n## Nasıl hissediyorum?\n\n\n## Bugün ne oldu?\n\n\n## Şükrettiğim üç şey\n- \n- \n- \n\n## Yarın için tek adım\n- [ ] ",
    tags: ["günlük"],
    createdAt: date,
    builtIn: true
  },
  {
    id: "meeting",
    name: "Toplantı notu",
    description: "Gündem, kararlar ve sonraki adımlar tek yerde.",
    scope: "personal",
    topic: "Toplantı",
    title: "Toplantı",
    content:
      "# Toplantı\n\n## Katılımcılar\n- \n\n## Gündem\n- \n\n## Notlar\n\n\n## Kararlar\n- \n\n## Aksiyonlar\n- [ ] ",
    tags: ["toplantı"],
    createdAt: date,
    builtIn: true
  },
  {
    id: "project",
    name: "Proje planı",
    description: "Amaç, kapsam, kilometre taşları ve riskler.",
    scope: "personal",
    topic: "Proje",
    title: "Yeni proje",
    content:
      "# Proje özeti\n\n## Amaç\n\n\n## Başarı ölçütleri\n- \n\n## Kilometre taşları\n- [ ] \n\n## Riskler\n- \n\n## Kaynaklar\n- ",
    tags: ["proje"],
    createdAt: date,
    builtIn: true
  },
  {
    id: "cornell",
    name: "Cornell ders notu",
    description: "Ana notlar, ipuçları ve kısa özet düzeni.",
    scope: "school",
    topic: "Ders",
    title: "Ders notu",
    content:
      "# Ders başlığı\n\n## Ana notlar\n\n\n## Anahtar kavramlar ve sorular\n- \n\n## Özet\n\n\n## Tekrar görevleri\n- [ ] ",
    tags: ["ders"],
    createdAt: date,
    builtIn: true
  },
  {
    id: "exam",
    name: "Sınav çalışma planı",
    description: "Konuları parçala, eksikleri ve tekrarları takip et.",
    scope: "school",
    topic: "Sınav",
    title: "Sınav çalışma planı",
    content:
      "# Sınav hedefi\n\n## Konular\n- [ ] \n\n## Zayıf olduğum yerler\n- \n\n## Çözülecek sorular\n- [ ] \n\n## Son tekrar\n- [ ] ",
    tags: ["sınav", "çalışma"],
    createdAt: date,
    builtIn: true
  },
  {
    id: "weekly-plan",
    name: "Haftalık plan",
    description: "Haftanın öncelikleri ve her güne düşen işler.",
    scope: "personal",
    topic: "Plan",
    title: "Haftalık plan",
    content:
      "# Bu haftanın odağı\n\n## En önemli üç sonuç\n- [ ] \n- [ ] \n- [ ] \n\n## Pazartesi\n- [ ] \n\n## Salı\n- [ ] \n\n## Çarşamba\n- [ ] \n\n## Perşembe\n- [ ] \n\n## Cuma\n- [ ] \n\n## Hafta sonu\n- [ ] ",
    tags: ["haftalık", "plan"],
    createdAt: date,
    builtIn: true
  }
];

export function allTemplates(custom: NoteTemplate[]): TemplateDefinition[] {
  return [
    ...BUILT_IN_TEMPLATES,
    ...custom.map((template) => ({ ...template, builtIn: false }))
  ];
}

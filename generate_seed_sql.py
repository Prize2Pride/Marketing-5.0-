import json
import datetime

def generate_seed_sql(num_levels=20, modules_per_level=3, chapters_per_module=3):
    sql_statements = []
    current_time = datetime.datetime.now().isoformat()

    # Levels
    for level_idx in range(1, num_levels + 1):
        level_name_en = f"Level {level_idx}: Digital Marketing {level_idx}.0"
        level_name_fr = f"Niveau {level_idx}: Marketing Digital {level_idx}.0"
        level_name_ar = f"المستوى {level_idx}: التسويق الرقمي {level_idx}.0"
        description_en = f"Description for Level {level_idx} in English."
        description_fr = f"Description pour le Niveau {level_idx} en Français."
        description_ar = f"وصف المستوى {level_idx} باللغة العربية."

        sql_statements.append(f"INSERT INTO levels (id, nameEn, nameFr, nameAr, descriptionEn, descriptionFr, descriptionAr, createdAt, updatedAt) VALUES ({level_idx}, '{level_name_en}', '{level_name_fr}', '{level_name_ar}', '{description_en}', '{description_fr}', '{description_ar}', '{current_time}', '{current_time}');")

    # Modules
    module_id_counter = 1
    for level_idx in range(1, num_levels + 1):
        for module_idx in range(1, modules_per_level + 1):
            module_name_en = f"Module {module_id_counter}: Core Concepts {module_idx}"
            module_name_fr = f"Module {module_id_counter}: Concepts Clés {module_idx}"
            module_name_ar = f"الوحدة {module_id_counter}: المفاهيم الأساسية {module_idx}"
            description_en = f"Description for Module {module_id_counter} in English."
            description_fr = f"Description pour le Module {module_id_counter} en Français."
            description_ar = f"وصف الوحدة {module_id_counter} باللغة العربية."

            sql_statements.append(f"INSERT INTO modules (id, levelId, nameEn, nameFr, nameAr, descriptionEn, descriptionFr, descriptionAr, createdAt, updatedAt) VALUES ({module_id_counter}, {level_idx}, '{module_name_en}', '{module_name_fr}', '{module_name_ar}', '{description_en}', '{description_fr}', '{description_ar}', '{current_time}', '{current_time}');")
            module_id_counter += 1

    # Chapters
    chapter_id_counter = 1
    for module_id in range(1, module_id_counter):
        for chapter_idx in range(1, chapters_per_module + 1):
            chapter_name_en = f"Chapter {chapter_id_counter}: Introduction to Topic {chapter_idx}"
            chapter_name_fr = f"Chapitre {chapter_id_counter}: Introduction au Sujet {chapter_idx}"
            chapter_name_ar = f"الفصل {chapter_id_counter}: مقدمة للموضوع {chapter_idx}"
            content_en = f"Content for Chapter {chapter_id_counter} in English. This is rich markdown content that can include code blocks, images, and other multimedia elements. For example, `console.log('Hello World');` or an image: ![Example Image](https://example.com/image.png)"
            content_fr = f"Contenu du Chapitre {chapter_id_counter} en Français. Ceci est un contenu riche en Markdown pouvant inclure des blocs de code, des images et d\'autres éléments multimédias. Par exemple, `console.log('Bonjour le monde');` ou une image : ![Image Exemple](https://example.com/image.png)"
            content_ar = f"محتوى الفصل {chapter_id_counter} باللغة العربية. هذا محتوى ماركداون غني يمكن أن يتضمن كتل تعليمات برمجية وصور وعناصر وسائط متعددة أخرى. على سبيل المثال، `console.log('مرحبا بالعالم');` أو صورة: ![صورة مثال](https://example.com/image.png)"
            content_type = "markdown"

            sql_statements.append(f"INSERT INTO chapters (id, moduleId, nameEn, nameFr, nameAr, contentEn, contentFr, contentAr, contentType, createdAt, updatedAt) VALUES ({chapter_id_counter}, {module_id}, '{chapter_name_en}', '{chapter_name_fr}', '{chapter_name_ar}', '{content_en}', '{content_fr}', '{content_ar}', '{content_type}', '{current_time}', '{current_time}');")
            chapter_id_counter += 1

    return "\n".join(sql_statements)

if __name__ == "__main__":
    sql = generate_seed_sql()
    with open("seed_data.sql", "w", encoding="utf-8") as f:
        f.write(sql)

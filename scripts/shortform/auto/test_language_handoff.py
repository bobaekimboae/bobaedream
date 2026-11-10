import tempfile
import unittest
from pathlib import Path

import auto_edit


class LanguageHandoffTest(unittest.TestCase):
    def facts(self, **overrides):
        return {
            'id': 'phase2-xc90',
            'make': '볼보',
            'model': 'XC90',
            'price_manwon': 8500,
            'options': ['통풍시트'],
            **overrides,
        }

    def test_user_approved_pronunciation_preserves_display(self):
        blocks = auto_edit.make_script_nasser(self.facts(), 'bobae_be')
        auto_edit.apply_pron(blocks)
        pairs = [word for block in blocks for word in block['words']]
        self.assertIn(('엑스씨구공!', 'XC90!'), pairs)

    def test_price_requires_explicit_approval_for_both_tones_and_config(self):
        for builder, style in [(auto_edit.make_script, 'bobae_nl'),
                               (auto_edit.make_script_nasser, 'bobae_be')]:
            for flag in [None, False, 'true', True]:
                with self.subTest(builder=builder.__name__, flag=flag):
                    facts = self.facts(price_public=flag)
                    blocks = builder(facts, style)
                    self.assertEqual('가격은' in auto_edit.tts_text(blocks), flag is True)
                    with tempfile.TemporaryDirectory() as tmp:
                        config = Path(tmp) / 'config.py'
                        auto_edit.write_config(facts, blocks, style, config)
                        self.assertEqual('8,500만' in config.read_text(encoding='utf-8'), flag is True)

    def test_option_bank_has_distinct_variants_and_reproducible_tone(self):
        for key in ['통풍시트', '열선시트(앞좌석)', '마사지시트', '후방카메라', '어라운드뷰',
                    '무선충전', '헤드업디스플레이(HUD)', '전동트렁크']:
            option = auto_edit.CAT[key]
            for field, endings in [('benefit', ('요.', '죠.')), ('benefit_f', ('니다.', '죠.'))]:
                variants = option[field + '_variants']
                self.assertEqual(len(set(variants)), 5)
                self.assertTrue(all(line.endswith(endings) for line in variants))
                self.assertIn(auto_edit.line(option, field, 'dealer-1'), variants)
                self.assertEqual(auto_edit.line(option, field, 'dealer-1'),
                                 auto_edit.line(option, field, 'dealer-1'))

    def test_option_without_chip_still_requires_correct_part_and_audio_time(self):
        blocks = [{'sec': 'options', 'parts': [['seats_front']], 'stickers': [],
                   'option_phrases': [0], '_style': 'bobae_nl'}]
        clips = [{'part': 'grille', 't0': 0.0, 't1': 8.0},
                 {'part': 'seats_front', 't0': 9.0, 't1': 9.4}]
        with self.assertRaisesRegex(ValueError, '음성 시각'):
            auto_edit.assign_shots(blocks, clips, {})
        with self.assertRaisesRegex(ValueError, '미사용 컷'):
            auto_edit.assign_shots(blocks, clips, {(0, 0): (0.0, 2.5)})
        clips[1]['t1'] = 12.0
        auto_edit.assign_shots(blocks, clips, {(0, 0): (0.0, 2.5)})
        self.assertEqual(blocks[0]['shot_parts'], ['seats_front'])
        start, speed, _ = blocks[0]['shot_tuples'][0]
        self.assertLessEqual(start + speed * 2.5, 12.0)

    def test_option_does_not_rewind_when_same_clip_is_spent(self):
        blocks = [{'sec': 'options', 'parts': [['seats_front'], ['seats_front']],
                   'stickers': [], 'option_phrases': [0, 1], '_style': 'bobae_nl'}]
        clips = [{'part': 'seats_front', 't0': 0.0, 't1': 2.5}]
        with self.assertRaisesRegex(ValueError, '미사용 컷'):
            auto_edit.assign_shots(blocks, clips, {(0, 0): (0.0, 2.2), (0, 1): (2.2, 4.4)})


if __name__ == '__main__':
    unittest.main()

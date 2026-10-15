import 'package:flutter/material.dart';

class AppColors {
  static const ink = Color(0xFF222222);
  static const sub = Color(0xFF595959);
  static const muted = Color(0xFF8C8C8C);
  static const line = Color(0xFFEBEBEB);
  static const photoBg = Color(0xFFEBEBEB);
  static const blue = Color(0xFF306BD9);
}

ThemeData buildTheme() => ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(seedColor: AppColors.ink, brightness: Brightness.light),
      scaffoldBackgroundColor: Colors.white,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.ink,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
    );

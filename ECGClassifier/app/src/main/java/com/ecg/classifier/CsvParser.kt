package com.ecg.classifier

import android.content.Context
import android.net.Uri
import java.io.BufferedReader
import java.io.InputStreamReader

/**
 * CsvParser — reads a CSV/TXT file and extracts exactly 187 float values.
 *
 * Supports:
 *  • Single-column CSV:  one value per line
 *  • Multi-column CSV:   reads left-to-right, top-to-bottom, skips headers
 *  • Comma-separated on one line: val1,val2,...,val187
 *  • Tab or space separated
 */
object CsvParser {

    private const val REQUIRED = 187

    sealed class ParseResult {
        data class Success(val signal: FloatArray) : ParseResult()
        data class Error(val message: String) : ParseResult()
    }

    fun parse(context: Context, uri: Uri): ParseResult {
        return try {
            val values = mutableListOf<Float>()

            context.contentResolver.openInputStream(uri)?.use { stream ->
                BufferedReader(InputStreamReader(stream)).use { reader ->
                    reader.lines().forEach { line ->
                        if (values.size >= REQUIRED) return@forEach
                        // Split by comma, tab, semicolon or whitespace
                        line.trim().split(Regex("[,;\\t\\s]+")).forEach { token ->
                            val t = token.trim()
                            t.toFloatOrNull()?.let { values.add(it) }
                        }
                    }
                }
            }

            when {
                values.size < REQUIRED ->
                    ParseResult.Error("Not enough values: found ${values.size}, need $REQUIRED.")
                else ->
                    ParseResult.Success(FloatArray(REQUIRED) { i -> values[i] })
            }
        } catch (e: Exception) {
            ParseResult.Error("Failed to read file: ${e.message}")
        }
    }

    /** Parse a raw text string (e.g. pasted from clipboard) */
    fun parseText(text: String): ParseResult {
        val values = text.trim()
            .split(Regex("[,;\\t\\n\\r\\s]+"))
            .mapNotNull { it.trim().toFloatOrNull() }

        return when {
            values.size < REQUIRED ->
                ParseResult.Error("Not enough values: found ${values.size}, need $REQUIRED.")
            else ->
                ParseResult.Success(FloatArray(REQUIRED) { i -> values[i] })
        }
    }
}

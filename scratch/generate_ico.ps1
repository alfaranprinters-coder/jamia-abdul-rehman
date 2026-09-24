Add-Type -AssemblyName System.Drawing

$sourcePng = Join-Path $PSScriptRoot "..\assets\89d64f89-4957-4daa-91dd-6c6656ca1a5b.png"
$sourcePng = [System.IO.Path]::GetFullPath($sourcePng)

$destPng = Join-Path $PSScriptRoot "..\assets\app_logo.png"
$destIco = Join-Path $PSScriptRoot "..\assets\app_logo.ico"
$installerIco = Join-Path $PSScriptRoot "..\installer\app_logo.ico"

# Copy PNG to app_logo.png
Copy-Item $sourcePng $destPng -Force

$csharpCode = @"
using System;
using System.IO;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Collections.Generic;

public class IcoGenerator
{
    private class IconEntry
    {
        public int Width;
        public int Height;
        public byte[] Data;
        public bool IsPng;
    }

    public static void CreateIco(string sourceImagePath, string targetIcoPath)
    {
        using (Bitmap original = new Bitmap(sourceImagePath))
        {
            List<IconEntry> entries = new List<IconEntry>();
            int[] sizes = new int[] { 256, 128, 64, 48, 32, 16 };

            foreach (int size in sizes)
            {
                using (Bitmap resized = new Bitmap(size, size, PixelFormat.Format32bppArgb))
                {
                    using (Graphics g = Graphics.FromImage(resized))
                    {
                        g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                        g.SmoothingMode = SmoothingMode.HighQuality;
                        g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                        g.CompositingQuality = CompositingQuality.HighQuality;
                        g.Clear(Color.Transparent);
                        g.DrawImage(original, 0, 0, size, size);
                    }

                    IconEntry entry = new IconEntry();
                    entry.Width = size;
                    entry.Height = size;

                    if (size >= 128)
                    {
                        // 256 and 128 as PNG
                        using (MemoryStream ms = new MemoryStream())
                        {
                            resized.Save(ms, ImageFormat.Png);
                            entry.Data = ms.ToArray();
                        }
                        entry.IsPng = true;
                    }
                    else
                    {
                        // 64, 48, 32, 16 as uncompressed BMP DIB for maximum Windows and Inno Setup compatibility
                        entry.Data = CreateBmpDib(resized);
                        entry.IsPng = false;
                    }

                    entries.Add(entry);
                }
            }

            using (FileStream fs = new FileStream(targetIcoPath, FileMode.Create, FileAccess.Write))
            using (BinaryWriter bw = new BinaryWriter(fs))
            {
                // ICONDIR Header
                bw.Write((ushort)0); // Reserved
                bw.Write((ushort)1); // Type 1 = ICO
                bw.Write((ushort)entries.Count); // Count

                int offset = 6 + (16 * entries.Count);

                // Directory entries
                foreach (var entry in entries)
                {
                    byte w = (byte)(entry.Width >= 256 ? 0 : entry.Width);
                    byte h = (byte)(entry.Height >= 256 ? 0 : entry.Height);
                    bw.Write(w);
                    bw.Write(h);
                    bw.Write((byte)0); // Colors in palette
                    bw.Write((byte)0); // Reserved
                    bw.Write((ushort)1); // Planes
                    bw.Write((ushort)32); // BPP
                    bw.Write((uint)entry.Data.Length);
                    bw.Write((uint)offset);

                    offset += entry.Data.Length;
                }

                // Image data
                foreach (var entry in entries)
                {
                    bw.Write(entry.Data);
                }
            }
        }
    }

    private static byte[] CreateBmpDib(Bitmap bmp)
    {
        int width = bmp.Width;
        int height = bmp.Height;

        int andRowBytes = ((width + 31) / 32) * 4;
        int andMaskSize = andRowBytes * height;
        int xorDataSize = width * height * 4;
        int headerSize = 40;

        byte[] dib = new byte[headerSize + xorDataSize + andMaskSize];

        using (MemoryStream ms = new MemoryStream(dib))
        using (BinaryWriter bw = new BinaryWriter(ms))
        {
            // BITMAPINFOHEADER
            bw.Write((uint)headerSize);
            bw.Write(width);
            bw.Write(height * 2); // Double height for ICO
            bw.Write((ushort)1);  // Planes
            bw.Write((ushort)32); // BitCount
            bw.Write((uint)0);    // Compression (BI_RGB)
            bw.Write((uint)(xorDataSize + andMaskSize)); // SizeImage
            bw.Write(0);          // XPelsPerMeter
            bw.Write(0);          // YPelsPerMeter
            bw.Write((uint)0);    // ClrUsed
            bw.Write((uint)0);    // ClrImportant

            // XOR data (bottom-up BGRA)
            for (int y = height - 1; y >= 0; y--)
            {
                for (int x = 0; x < width; x++)
                {
                    Color c = bmp.GetPixel(x, y);
                    bw.Write(c.B);
                    bw.Write(c.G);
                    bw.Write(c.R);
                    bw.Write(c.A);
                }
            }

            // AND mask (bottom-up, 1-bit per pixel)
            for (int y = height - 1; y >= 0; y--)
            {
                byte currentByte = 0;
                int bitIndex = 0;
                int bytesWrittenInRow = 0;

                for (int x = 0; x < width; x++)
                {
                    Color c = bmp.GetPixel(x, y);
                    // 1 bit: 1 if transparent (A == 0), 0 if opaque
                    if (c.A < 128)
                    {
                        currentByte |= (byte)(0x80 >> bitIndex);
                    }
                    bitIndex++;
                    if (bitIndex == 8)
                    {
                        bw.Write(currentByte);
                        bytesWrittenInRow++;
                        currentByte = 0;
                        bitIndex = 0;
                    }
                }
                if (bitIndex > 0)
                {
                    bw.Write(currentByte);
                    bytesWrittenInRow++;
                }
                // Pad to 4 bytes
                while (bytesWrittenInRow < andRowBytes)
                {
                    bw.Write((byte)0);
                    bytesWrittenInRow++;
                }
            }
        }

        return dib;
    }
}
"@

Add-Type -TypeDefinition $csharpCode -ReferencedAssemblies System.Drawing

[IcoGenerator]::CreateIco($sourcePng, $destIco)
Copy-Item $destIco $installerIco -Force

Write-Output "SUCCESS: Generated $destIco and $installerIco"

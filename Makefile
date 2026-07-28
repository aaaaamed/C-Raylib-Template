CC = gcc
CFLAGS = -I./include -L./lib -lraylib -lGL -lm -lpthread -ldl -lrt -lX11

WCC = x86_64-w64-mingw32-gcc 
WCFLAGS = -I./include -L./lib/win -lraylib -lgdi32 -lwinmm -lopengl32 -static -Wl,-Bstatic

.SILENT:
.PHONY: clean win

main: main.c include/raylib.h lib/libraylib.a
	$(CC) main.c -o main $(CFLAGS)

win: main.exe

main.exe: main.c include/raylib.h lib/win/libraylib.a
	$(WCC) main.c -o main $(WCFLAGS)

clean:
	rm -f main main.exe 

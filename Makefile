CC = gcc
CFLAGS = -I./include -L./lib -lraylib -lGL -lm -lpthread -ldl -lrt -lX11

WCC = x86_64-w64-mingw32-gcc 
WCFLAGS = -I./include -L./lib/win -lraylib -lgdi32 -lwinmm -lopengl32 -static -Wl,-Bstatic

main: main.c include/raylib.h lib/libraylib.a
	$(CC) main.c -o main $(CFLAGS)

main.exe: main.c include/raylib.h lib/win/libraylib.a
	$(WCC) main.c -o main $(WCFLAGS)

.PHONY: clean
clean:
	rm -f main main.exe 

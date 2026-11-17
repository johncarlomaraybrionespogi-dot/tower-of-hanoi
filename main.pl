% TOWER OF HANOI SOLVER
% Logical Programming Project

:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_json)).
:- use_module(library(http/http_files)).
:- use_module(library(lists)).

% Start the web server on port 8000
server :-
    http_server(http_dispatch, [port(8000)]),
    format('Tower of Hanoi server started!~n'),
    format('Open http://localhost:8000~n').

% Find the folder containing this main.pl file
:- prolog_load_context(file, ThisFile),
   absolute_file_name(ThisFile, AbsoluteFile),
   file_directory_name(AbsoluteFile, ProjectDirectory),
   http_handler(
       root(.),
       http_reply_from_files(
           ProjectDirectory,
           [indexes(['index.html'])]
       ),
       [prefix]
   ).

% Prolog solving API
:- http_handler(root(api/solve), solve_handler, []).

% Receive the number of disks and calculate moves
solve_handler(Request) :-
    http_read_json_dict(Request, Data),
    (   get_dict(disks, Data, N),
        integer(N),
        between(3, 7, N)
    ->
        hanoi(N, left, right, middle, Moves),
        reply_json_dict(_{moves: Moves})
    ;
        reply_json_dict(_{error: "Choose between 3 and 7 disks."})
    ).

% Tower of Hanoi algorithm
hanoi(1, From, To, _, [Move]) :-
    Move = _{from: From, to: To}.

hanoi(N, From, To, Auxiliary, Moves) :-
    N > 1,
    N1 is N - 1,
    hanoi(N1, From, Auxiliary, To, First),
    hanoi(1, From, To, Auxiliary, Second),
    hanoi(N1, Auxiliary, To, From, Third),
    append(First, Second, Temp),
    append(Temp, Third, Moves).
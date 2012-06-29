'''Model basics

These are the base classes that the real models are based up-on.

Every subdirectory here contains real models.
These models are directly callable via RPC, but can also be instantiated and called directly via python code.
(e.g. a model can instantiate and call other models)

The nice thing is that authorisation checks are still done when calling methods on directly instantiated models.
'''
